"""Recebe erros do frontend (Error Boundary, window.onerror)."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request

from backend.core.logging import logger, mask_text, request_id_var
from backend.core.security import client_ip, client_log_limiter
from backend.models.schemas import Accepted, ClientLogIn
from backend.repositories import Repository, get_repository
from backend.routers.common import RATE_LIMITED

router = APIRouter(prefix="/logs", tags=["logs"])

_LEVELS = {"error": logger.error, "warning": logger.warning, "info": logger.info}


@router.post(
    "/client",
    response_model=Accepted,
    status_code=202,
    summary="Registra um erro do navegador",
    responses=RATE_LIMITED,
)
def client_log(
    body: ClientLogIn, request: Request, repo: Repository = Depends(get_repository)
) -> Accepted:
    """Público (erros podem acontecer antes do login), com limite de tamanho e de frequência.

    O conteúdo é mascarado (e-mails, tokens, senhas) antes de ser guardado.
    """
    ip = client_ip(request)
    client_log_limiter.check(ip)
    client_log_limiter.hit(ip)
    entry = {
        "time": datetime.now(UTC).isoformat(timespec="seconds"),
        "level": body.level,
        "message": mask_text(body.message),
        "stack": mask_text(body.stack) if body.stack else None,
        "url": mask_text(body.url) if body.url else None,
        "user_agent": body.user_agent,
        "component": body.component,
        "request_id": request_id_var.get(),
    }
    repo.add_client_log(entry)
    _LEVELS[body.level](
        "erro do cliente: " + entry["message"][:300],
        extra={"source": "client", "url": entry["url"], "component": body.component},
    )
    return Accepted()
