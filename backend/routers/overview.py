"""Alagamentos, alertas, indicadores, previsões e meta."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from backend import __version__
from backend.core.errors import ValidationAppError
from backend.core.security import require_any_role
from backend.models.schemas import (
    Alert,
    FloodAreasResponse,
    Horizon,
    KpisResponse,
    MetaResponse,
    Next3MonthsResponse,
    Page,
    SeasonalCalendarResponse,
    User,
    YearlyResponse,
)
from backend.repositories import Repository, get_repository
from backend.routers.common import AUTH_ERRORS, paginate
from backend.services import views
from backend.services.seasonality import events_between

public_router = APIRouter(tags=["meta"])
router = APIRouter(responses=AUTH_ERRORS, dependencies=[Depends(require_any_role)])


@public_router.get("/meta", response_model=MetaResponse, summary="Sobre os dados (público)")
def meta(repo: Repository = Depends(get_repository)) -> dict:
    """Horário de geração ("Atualizado às HH:MM") e aviso de dados simulados."""
    data = repo.meta()
    return {
        **data,
        "version": data.get("version") or __version__,
        "degraded": any(status != "ok" for status in repo.load_status().values()),
    }


@router.get(
    "/flood-areas",
    response_model=FloodAreasResponse,
    summary="Áreas de alagamento com risco no horizonte",
    tags=["alagamentos"],
)
def flood_areas(
    horizon: Annotated[
        Horizon, Query(description="Horizonte: agora, 24 h, 72 h ou 3 meses")
    ] = "72h",
    repo: Repository = Depends(get_repository),
) -> dict:
    """Risco 0–100 (baixo/médio/alto) por área, da mais crítica para a menos."""
    items = views.list_flood_areas(repo, horizon)
    return {
        "horizon": horizon,
        "rain": repo.rain().get("horizons", {}).get(horizon),
        "items": items,
        "total": len(items),
        "high_risk": sum(1 for i in items if i["level"] == "alto"),
    }


@router.get("/alerts", response_model=Page[Alert], summary="Alertas ativos", tags=["alertas"])
def alerts(
    type: Annotated[
        Literal[
            "flood_high_risk",
            "chronic_recurrence",
            "awareness",
            "seasonal_event",
            "debris_forecast",
        ]
        | None,
        Query(description="Tipo de alerta"),
    ] = None,
    severity: Annotated[
        Literal["critical", "high", "medium", "info"] | None, Query(description="Severidade")
    ] = None,
    page: Annotated[int, Query(ge=1, le=10_000)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    repo: Repository = Depends(get_repository),
) -> dict:
    """Risco alto de alagamento, reincidência crônica, conscientização, sazonais e entulho."""
    items = [
        a
        for a in repo.alerts()
        if (type is None or a.get("type") == type)
        and (severity is None or a.get("severity") == severity)
    ]
    items.sort(key=lambda a: (views.SEVERITY_ORDER.get(a.get("severity"), 9), a.get("id", "")))
    return paginate(items, page, page_size)


@router.get("/kpis", response_model=KpisResponse, summary="Indicadores", tags=["indicadores"])
def kpis(repo: Repository = Depends(get_repository)) -> dict:
    """Indicadores do mapa e de impacto (antes × depois do início das previsões)."""
    return repo.kpis()


@router.get(
    "/forecasts/yearly",
    response_model=YearlyResponse,
    summary="Comparativo anual 2022–2026",
    tags=["previsões"],
)
def yearly(repo: Repository = Depends(get_repository)) -> dict:
    """2026 é parcial: compare períodos iguais (`jan_to_ref`, `jul_to_ref`)."""
    k = repo.kpis()
    return {"as_of": k.get("as_of"), "system_start": k.get("system_start"), "years": repo.yearly()}


@router.get(
    "/forecasts/next-3-months",
    response_model=Next3MonthsResponse,
    summary="Próximos 3 meses: sem ação × com o plano",
    tags=["previsões"],
)
def next_3_months(repo: Repository = Depends(get_repository)) -> dict:
    return repo.next3months()


@router.get(
    "/forecasts/seasonal-calendar",
    response_model=SeasonalCalendarResponse,
    summary="Calendário de riscos sazonais",
    tags=["previsões"],
)
def seasonal_calendar(
    start: Annotated[date | None, Query(description="Início (padrão: data de referência)")] = None,
    end: Annotated[date | None, Query(description="Fim (padrão: início + 180 dias)")] = None,
    repo: Repository = Depends(get_repository),
    _: User = Depends(require_any_role),
) -> dict:
    """Natal e Ano-Novo, Carnaval, volta às aulas, chuvas de verão, ExpoLondrina e feriados."""
    as_of = repo.forecasts_as_of()
    reference = datetime.fromisoformat(as_of).date() if as_of else date.today()
    start = start or reference
    end = end or start + timedelta(days=180)
    if end < start:
        raise ValidationAppError("A data final deve ser igual ou posterior à inicial.")
    if (end - start).days > 731:
        raise ValidationAppError("O intervalo máximo do calendário é de 2 anos.")
    events = []
    for event in events_between(start, end):
        modules = []
        if event.debris_factor > 1:
            modules.append("residuos")
        if event.flood_factor > 1:
            modules.append("alagamentos")
        events.append(
            {
                "key": event.key,
                "name": event.name,
                "start": event.start,
                "end": event.end,
                "debris_factor": event.debris_factor,
                "flood_factor": event.flood_factor,
                "description": event.description,
                "modules": modules,
                "active": event.start <= reference <= event.end,
                "days_until": max(0, (event.start - reference).days),
            }
        )
    return {"start": start, "end": end, "reference_date": reference, "events": events}
