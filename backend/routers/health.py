"""Verificação de saúde da API."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from backend import __version__
from backend.core.config import data_dir

router = APIRouter(tags=["saúde"])


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    time: datetime


def _seed_available() -> bool:
    """True se a pasta de dados está no bundle e tem ao menos um JSON."""
    try:
        return any(data_dir().glob("*.json"))
    except OSError:
        return False


@router.get("/health", response_model=HealthResponse, summary="Saúde da API")
def health() -> HealthResponse:
    """Retorna o status da API, a versão e o horário do servidor (UTC).

    `degraded` indica que os arquivos de dados não foram encontrados.
    """
    return HealthResponse(
        status="ok" if _seed_available() else "degraded",
        version=__version__,
        time=datetime.now(UTC),
    )
