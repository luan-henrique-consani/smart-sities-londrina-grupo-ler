"""Trilha de auditoria: quem acessou, exportou ou apagou dados pessoais (sem guardar o nome)."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Request

from backend.core.logging import logger, request_id_var
from backend.repositories import Repository


def record_audit(
    repo: Repository,
    request: Request,
    action: str,
    *,
    user_id: str | None,
    role: str | None,
    resource: str | None = None,
) -> None:
    """Registra a ação. O usuário aparece só pelo id (U-01) e pelo perfil: nunca nome nem e-mail."""
    entry = {
        "time": datetime.now(UTC).isoformat(timespec="seconds"),
        "action": action,
        "user_id": user_id,
        "role": role,
        "resource": resource,
        "request_id": getattr(request.state, "request_id", None) or request_id_var.get(),
    }
    repo.add_audit(entry)
    logger.info("auditoria", extra={"action": action, "user_id": user_id, "resource": resource})
