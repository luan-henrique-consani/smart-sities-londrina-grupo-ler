"""Pontos de descarte irregular: lista, detalhe e decisões."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query

from backend.core.errors import NotFoundError
from backend.core.logging import logger
from backend.core.security import require_any_role, require_roles
from backend.models.schemas import (
    AREA_ID_PATTERN,
    POINT_ID_PATTERN,
    Decision,
    DecisionCreate,
    Horizon,
    Page,
    PointDetail,
    PointSummary,
    User,
    WasteType,
)
from backend.repositories import Record, Repository, get_repository
from backend.routers.common import AUTH_ERRORS, NOT_FOUND, paginate
from backend.services import views

router = APIRouter(prefix="/points", tags=["resíduos"], responses=AUTH_ERRORS)

PointId = Annotated[
    str, Path(pattern=POINT_ID_PATTERN, description="Código do ponto", examples=["D-0004"])
]


def _get_point(repo: Repository, point_id: str) -> Record:
    point = repo.point(point_id)
    if point is None:
        raise NotFoundError("Ponto de descarte não encontrado.")
    return point


@router.get("", response_model=Page[PointSummary], summary="Lista os pontos de descarte")
def list_points(
    type: Annotated[WasteType | None, Query(description="Tipo de resíduo")] = None,
    risk: Annotated[
        Literal["baixo", "medio", "médio", "alto"] | None, Query(description="Nível de risco")
    ] = None,
    area: Annotated[
        str | None, Query(pattern=AREA_ID_PATTERN, description="Bairro/área (id)")
    ] = None,
    horizon: Annotated[
        Horizon | None,
        Query(
            description=(
                "Só pontos com lixo no local (now) ou com acúmulo previsto dentro do horizonte"
            )
        ),
    ] = None,
    chronic: Annotated[bool | None, Query(description="Só reincidentes crônicos")] = None,
    sort: Annotated[
        Literal["risk", "next", "episodes", "id"], Query(description="Ordenação")
    ] = "risk",
    page: Annotated[int, Query(ge=1, le=10_000)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
    repo: Repository = Depends(get_repository),
    _: User = Depends(require_any_role),
) -> dict:
    """Pontos com previsão do próximo acúmulo, risco e status de reincidência."""
    items = views.list_points(
        repo, waste_type=type, risk=risk, area=area, horizon=horizon, chronic=chronic, sort=sort
    )
    return paginate(items, page, page_size)


@router.get(
    "/{point_id}",
    response_model=PointDetail,
    summary="Detalhe de um ponto",
    responses=NOT_FOUND,
)
def get_point(
    point_id: PointId,
    episodes_limit: Annotated[int, Query(ge=0, le=500)] = 50,
    cleanings_limit: Annotated[int, Query(ge=0, le=500)] = 50,
    repo: Repository = Depends(get_repository),
    _: User = Depends(require_any_role),
) -> dict:
    """Histórico de episódios e limpezas, previsão, reincidência e padrão de horário."""
    return views.point_detail(
        repo,
        _get_point(repo, point_id),
        episodes_limit=episodes_limit,
        cleanings_limit=cleanings_limit,
    )


@router.post(
    "/{point_id}/decisions",
    response_model=Decision,
    status_code=201,
    summary="Registra uma decisão sobre o ponto",
    responses=NOT_FOUND,
)
def create_decision(
    point_id: PointId,
    body: DecisionCreate,
    repo: Repository = Depends(get_repository),
    user: User = Depends(require_roles("admin", "gestor", "tecnico")),
) -> Record:
    """Registra recomendação → decisão → intervenção.

    Fica no store em memória (zera no cold start). Perfis: Administrador,
    Gestor e Técnico de campo.
    """
    _get_point(repo, point_id)
    record = repo.add_decision(
        point_id,
        {
            **body.model_dump(),
            "created_at": datetime.now(UTC),
            "created_by_role": user.role,
            "created_by_id": user.id,
        },
    )
    logger.info(
        "decisão registrada",
        extra={"point_id": point_id, "decision": body.decision, "user_id": user.id},
    )
    return record
