"""Autenticação e autorização: Argon2, JWT em cookie, limite de tentativas e RBAC."""

from __future__ import annotations

import secrets
import threading
import time
from collections import defaultdict, deque
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error, InvalidHashError
from fastapi import Depends, Request

from backend.core import config
from backend.core.errors import ForbiddenError, RateLimitedError, UnauthorizedError
from backend.models.schemas import Role, User
from backend.repositories import Repository, get_repository

_hasher = PasswordHasher()
# Hash de uma senha aleatória: usado para gastar o mesmo tempo quando o e-mail não existe.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))

STAFF_ROLES: tuple[Role, ...] = ("admin", "gestor", "tecnico", "defesa_civil")
# Leitura: servidores + visitante (demonstração, somente leitura).
ALL_ROLES: tuple[Role, ...] = (*STAFF_ROLES, "visitante")

# Visitante só altera estado nestas rotas (encerrar a sessão, log de erros do navegador).
VISITOR_WRITE_ALLOWED = {"/api/auth/logout", "/api/auth/visitor", "/api/logs/client"}


def verify_password(password_hash: str | None, password: str) -> bool:
    """Verifica a senha com Argon2 (tempo parecido mesmo sem usuário)."""
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and bool(password_hash)
    except (Argon2Error, InvalidHashError):
        return False


def create_session_token(
    user_id: str,
    role: str,
    consent: dict[str, str] | None = None,
    hours: float | None = None,
) -> tuple[str, datetime, str]:
    """Cria o JWT de sessão. Retorna (token, expira_em, jti).

    `consent` ({"version", "accepted_at"}) leva o aceite do termo já registrado para a sessão.
    """
    now = datetime.now(UTC)
    expires = now + timedelta(hours=hours or config.SESSION_HOURS)
    jti = secrets.token_urlsafe(12)
    claims: dict[str, Any] = {"sub": user_id, "role": role, "iat": now, "exp": expires, "jti": jti}
    if consent:
        claims["consent"] = consent["version"]
        claims["consent_at"] = consent["accepted_at"]
    token = jwt.encode(
        claims,
        config.jwt_secret(),
        algorithm=config.JWT_ALGORITHM,
    )
    return token, expires, jti


def reissue_with_consent(claims: dict[str, Any], version: str, accepted_at: datetime) -> str:
    """Novo JWT com o consentimento (mesmo jti e mesma expiração: não prolonga a sessão)."""
    payload = {k: v for k, v in claims.items() if k not in ("consent", "consent_at")}
    payload["consent"] = version
    payload["consent_at"] = accepted_at.isoformat(timespec="seconds")
    return jwt.encode(payload, config.jwt_secret(), algorithm=config.JWT_ALGORITHM)


def session_claims(request: Request) -> dict[str, Any]:
    """Claims do JWT do cookie (já validado por get_current_user)."""
    token = request.cookies.get(config.SESSION_COOKIE)
    if not token:
        raise UnauthorizedError()
    return decode_session_token(token)


def decode_session_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token,
            config.jwt_secret(),
            algorithms=[config.JWT_ALGORITHM],
            options={"require": ["sub", "exp", "jti"]},
        )
    except jwt.PyJWTError as exc:
        raise UnauthorizedError() from exc


class RateLimiter:
    """Janela deslizante em memória (por instância da função)."""

    def __init__(self, max_events: int, window_seconds: float) -> None:
        self.max_events = max_events
        self.window = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        events = self._events[key]
        while events and now - events[0] >= self.window:
            events.popleft()
        return events

    def retry_after(self, key: str) -> int:
        """Segundos até liberar; 0 se a chave não está bloqueada."""
        now = time.monotonic()
        with self._lock:
            events = self._prune(key, now)
            if len(events) < self.max_events:
                return 0
            return max(1, int(self.window - (now - events[0])) + 1)

    def hit(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            self._prune(key, now).append(now)
            if len(self._events) > 10_000:  # evita crescer sem limite
                for k in [k for k, v in self._events.items() if not v]:
                    del self._events[k]

    def check(self, key: str) -> None:
        wait = self.retry_after(key)
        if wait:
            raise RateLimitedError(headers={"Retry-After": str(wait)})

    def reset(self) -> None:
        with self._lock:
            self._events.clear()


login_limiter = RateLimiter(config.LOGIN_MAX_FAILURES, config.LOGIN_WINDOW_SECONDS)
client_log_limiter = RateLimiter(config.CLIENT_LOG_MAX_PER_MINUTE, 60)


visitor_limiter = RateLimiter(config.VISITOR_MAX_PER_MINUTE, 60)


def visitor_user(subject: str) -> User:
    """Usuário sintético do visitante: sem cadastro, sem dados pessoais."""
    return User(
        id=subject, name="Visitante", email="", role="visitante", job_title="Modo demonstração"
    )


def client_ip(request: Request) -> str:
    """IP do cliente (na Vercel, o primeiro valor de X-Forwarded-For)."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    return request.client.host if request.client else "desconhecido"


def get_current_user(
    request: Request, repo: Repository = Depends(get_repository)
) -> User:
    """Usuário da sessão (cookie httpOnly com JWT). 401 se ausente, inválido ou revogado."""
    token = request.cookies.get(config.SESSION_COOKIE)
    if not token:
        raise UnauthorizedError()
    claims = decode_session_token(token)
    if repo.is_token_revoked(str(claims["jti"])):
        raise UnauthorizedError()
    subject = str(claims["sub"])
    if claims.get("role") == "visitante":
        # Sessão de visitante: sem cadastro; o prefixo do sub impede forjar um servidor.
        if not subject.startswith(config.VISITOR_ID_PREFIX):
            raise UnauthorizedError()
        user = visitor_user(subject)
        request.state.user_id = None  # nada de identificador de visitante nos logs
        request.state.user_role = user.role
        return user
    record = repo.user_by_id(subject)
    if record is None:
        raise UnauthorizedError()
    user = User.model_validate(record)
    request.state.user_id = user.id
    request.state.user_role = user.role
    return user


def require_roles(*roles: Role) -> Callable[..., User]:
    """Dependência de RBAC: 403 se o perfil do usuário não está na lista."""

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenError()
        return user

    return dependency


require_any_role = require_roles(*ALL_ROLES)
# Dados pessoais/privacidade e escrita: só servidores (visitante recebe 403).
require_staff = require_roles(*STAFF_ROLES)


def visitor_write_guard(request: Request) -> None:
    """Defesa em profundidade (dependência global): visitante nunca altera estado.

    Independe das dependências de cada rota: qualquer método que não seja de leitura é 403
    para sessão de visitante, salvo encerrar a sessão e enviar logs de erro do navegador.
    """
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    if request.url.path.rstrip("/") in VISITOR_WRITE_ALLOWED:
        return
    token = request.cookies.get(config.SESSION_COOKIE)
    if not token:
        return
    try:
        claims = decode_session_token(token)
    except UnauthorizedError:
        return
    if claims.get("role") == "visitante":
        raise ForbiddenError("O modo visitante é somente leitura.")
