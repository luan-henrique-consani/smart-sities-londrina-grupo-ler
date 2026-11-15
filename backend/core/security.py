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

ALL_ROLES: tuple[Role, ...] = ("admin", "gestor", "tecnico", "defesa_civil")


def verify_password(password_hash: str | None, password: str) -> bool:
    """Verifica a senha com Argon2 (tempo parecido mesmo sem usuário)."""
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and bool(password_hash)
    except (Argon2Error, InvalidHashError):
        return False


def create_session_token(user_id: str, role: str) -> tuple[str, datetime, str]:
    """Cria o JWT de sessão. Retorna (token, expira_em, jti)."""
    now = datetime.now(UTC)
    expires = now + timedelta(hours=config.SESSION_HOURS)
    jti = secrets.token_urlsafe(12)
    token = jwt.encode(
        {"sub": user_id, "role": role, "iat": now, "exp": expires, "jti": jti},
        config.jwt_secret(),
        algorithm=config.JWT_ALGORITHM,
    )
    return token, expires, jti


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
    record = repo.user_by_id(str(claims["sub"]))
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
