"""Autenticação: login, logout e usuário da sessão."""

from __future__ import annotations

from datetime import UTC, datetime

import jwt
from fastapi import APIRouter, Depends, Request, Response

from backend.core import config
from backend.core.errors import ErrorResponse, UnauthorizedError
from backend.core.logging import logger
from backend.core.security import (
    client_ip,
    create_session_token,
    get_current_user,
    login_limiter,
    verify_password,
)
from backend.models.schemas import ConsentStatus, LoginRequest, SessionResponse, User
from backend.repositories import Repository, get_repository
from backend.routers.common import RATE_LIMITED
from backend.services.audit import record_audit

router = APIRouter(prefix="/auth", tags=["autenticação"])


def consent_from_claims(claims: dict) -> ConsentStatus:
    """Consentimento aceito, lido do JWT (sobrevive ao cold start, pois vai no cookie)."""
    version = claims.get("consent")
    accepted_at = None
    if claims.get("consent_at"):
        try:
            accepted_at = datetime.fromisoformat(str(claims["consent_at"]))
        except ValueError:
            accepted_at = None
    return ConsentStatus(
        accepted=version == config.CONSENT_VERSION,
        required_version=config.CONSENT_VERSION,
        accepted_version=version,
        accepted_at=accepted_at,
    )


def set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        config.SESSION_COOKIE,
        token,
        max_age=config.SESSION_HOURS * 3600,
        httponly=True,
        secure=config.cookie_secure(),
        samesite="lax",
        path="/",
    )


def clear_cookie(response: Response) -> None:
    response.delete_cookie(
        config.SESSION_COOKIE,
        path="/",
        httponly=True,
        secure=config.cookie_secure(),
        samesite="lax",
    )


@router.post(
    "/login",
    response_model=SessionResponse,
    summary="Entrar com e-mail e senha",
    responses={
        401: {"model": ErrorResponse, "description": "E-mail ou senha incorretos"},
        422: {"model": ErrorResponse, "description": "Entrada inválida"},
        **RATE_LIMITED,
    },
)
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    repo: Repository = Depends(get_repository),
) -> SessionResponse:
    """Cria a sessão (JWT em cookie httpOnly, Secure, SameSite=Lax, 8 h).

    Limite: 5 tentativas falhas por minuto por IP; depois disso, 429.
    """
    ip = client_ip(request)
    login_limiter.check(ip)

    record = repo.user_by_email(body.email)
    if not verify_password(record.get("password_hash") if record else None, body.password):
        login_limiter.hit(ip)
        logger.warning("login recusado", extra={"reason": "credenciais inválidas"})
        raise UnauthorizedError("E-mail ou senha incorretos.", code="invalid_credentials")

    user = User.model_validate(record)
    saved = repo.consent_for(user.id)
    consent = saved if saved and saved.get("version") == config.CONSENT_VERSION else None
    token, expires_at, _ = create_session_token(user.id, user.role, consent)
    set_cookie(response, token)
    logger.info("login realizado", extra={"user_id": user.id, "role": user.role})
    record_audit(repo, request, "login", user_id=user.id, role=user.role)
    status = consent_from_claims(
        {
            "consent": (consent or {}).get("version"),
            "consent_at": (consent or {}).get("accepted_at"),
        }
    )
    return SessionResponse(user=user, expires_at=expires_at, consent=status)


@router.post("/logout", status_code=204, summary="Sair (encerra a sessão)")
def logout(request: Request, repo: Repository = Depends(get_repository)) -> Response:
    """Apaga o cookie e revoga o token (lista em memória, por instância)."""
    token = request.cookies.get(config.SESSION_COOKIE)
    if token:
        try:
            claims = jwt.decode(
                token, config.jwt_secret(), algorithms=[config.JWT_ALGORITHM]
            )
            repo.revoke_token(str(claims.get("jti")), float(claims.get("exp", 0)))
            record_audit(
                repo, request, "logout", user_id=str(claims.get("sub")), role=claims.get("role")
            )
        except jwt.PyJWTError:
            pass  # token inválido: basta apagar o cookie
    response = Response(status_code=204)
    clear_cookie(response)
    return response


@router.get(
    "/me",
    response_model=SessionResponse,
    summary="Usuário da sessão atual",
    responses={401: {"model": ErrorResponse, "description": "Sem sessão ou sessão expirada"}},
)
def me(request: Request, user: User = Depends(get_current_user)) -> SessionResponse:
    expires_at = None
    claims: dict = {}
    try:
        claims = jwt.decode(
            request.cookies[config.SESSION_COOKIE],
            config.jwt_secret(),
            algorithms=[config.JWT_ALGORITHM],
        )
        expires_at = datetime.fromtimestamp(claims["exp"], UTC)
    except (jwt.PyJWTError, KeyError):
        pass
    return SessionResponse(user=user, expires_at=expires_at, consent=consent_from_claims(claims))
