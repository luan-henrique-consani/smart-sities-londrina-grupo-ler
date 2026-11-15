"""Administração: saúde do sistema e trilha de auditoria (só Administrador)."""

from __future__ import annotations

import time
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request

from backend import __version__
from backend.core import config
from backend.core.logging import error_buffer
from backend.core.security import require_roles
from backend.models.schemas import AuditResponse, SystemHealth, User
from backend.repositories import Repository, get_repository
from backend.routers.common import AUTH_ERRORS
from backend.services import llm
from backend.services.audit import record_audit

router = APIRouter(prefix="/admin", tags=["administração"], responses=AUTH_ERRORS)

STARTED_MONOTONIC = time.monotonic()
STARTED_AT = datetime.now(UTC)

_admin = require_roles("admin")


@router.get("/system-health", response_model=SystemHealth, summary="Saúde do sistema")
def system_health(repo: Repository = Depends(get_repository), _: User = Depends(_admin)) -> dict:
    """Versão, uptime, dados carregados, modo do LLM, contagem de erros e os últimos 20."""
    status = repo.load_status()
    meta = repo.meta()
    errors = [r for r in error_buffer.records if r["level"] in ("ERROR", "CRITICAL")]
    client_errors = [
        {
            "time": c["time"],
            "level": str(c["level"]).upper(),
            "message": c["message"],
            "request_id": c.get("request_id"),
        }
        for c in repo.client_logs()
    ]
    mode = llm.llm_mode()
    return {
        "status": "ok" if all(v == "ok" for v in status.values()) else "degraded",
        "version": __version__,
        "started_at": STARTED_AT.isoformat(timespec="seconds"),
        "uptime_seconds": int(time.monotonic() - STARTED_MONOTONIC),
        "data_generated_at": meta.get("generated_at"),
        "data_files": status,
        "data_counts": meta.get("counts", {}),
        "llm_mode": mode,
        "llm_model": config.anthropic_model() if mode == "api" else None,
        "sentry_enabled": bool(config.sentry_dsn()),
        "error_counts": dict(error_buffer.counts),
        "recent_errors": list(reversed(errors))[:20],
        "recent_client_errors": list(reversed(client_errors))[:20],
        "memory_store_notice": (
            "Erros e escritas ficam em memória e zeram a cada cold start da função serverless."
        ),
    }


@router.get("/audit", response_model=AuditResponse, summary="Trilha de auditoria")
def audit_trail(
    request: Request,
    repo: Repository = Depends(get_repository),
    user: User = Depends(_admin),
) -> dict:
    """Quem acessou, exportou ou apagou dados pessoais (retenção de 6 meses). O próprio acesso
    à trilha também é registrado."""
    record_audit(repo, request, "consulta_trilha_auditoria", user_id=user.id, role=user.role)
    items = list(reversed(repo.audit_entries()))[:200]
    return {"retention_days": config.AUDIT_RETENTION_DAYS, "items": items}
