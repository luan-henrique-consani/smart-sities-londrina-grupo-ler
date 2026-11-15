"""Textos gerados (IA ou fallback): conscientização e explicação dos números."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query

from backend.core import config
from backend.core.errors import NotFoundError, ValidationAppError
from backend.core.logging import logger
from backend.core.security import require_any_role, require_roles
from backend.models.schemas import (
    FLOOD_AREA_ID_PATTERN,
    POINT_ID_PATTERN,
    AwarenessRequest,
    AwarenessResponse,
    ExplainContext,
    ExplainResponse,
    User,
)
from backend.repositories import Repository, get_repository
from backend.routers.common import AUTH_ERRORS, NOT_FOUND
from backend.services import llm, text_templates, views

_require_editor = require_roles("admin", "gestor")

router = APIRouter(prefix="/ai", tags=["IA"], responses={**AUTH_ERRORS, **NOT_FOUND})


@router.post(
    "/awareness",
    response_model=AwarenessResponse,
    summary="Gera material de conscientização para um ponto",
)
def awareness(
    body: AwarenessRequest,
    repo: Repository = Depends(get_repository),
    user: User = Depends(_require_editor),
) -> dict:
    """Cartaz, post para redes, roteiro porta a porta ou plano de ação de 30 dias.

    Os números vêm dos modelos estatísticos; o texto vem do Claude (se houver
    chave) ou dos modelos prontos (`mode: "fallback"`). Perfis: Administrador e Gestor.
    """
    point = repo.point(body.point_id)
    if point is None:
        raise NotFoundError("Ponto de descarte não encontrado.")
    facts = views.point_facts(repo, point)
    result, variant = llm.generate_awareness(
        body.material, body.audience, body.tone, facts, body.variant
    )
    logger.info(
        "material gerado",
        extra={
            "point_id": body.point_id,
            "material": body.material,
            "mode": result.mode,
            "user_id": user.id,
        },
    )
    return {
        "point_id": body.point_id,
        "material": body.material,
        "audience": body.audience,
        "tone": body.tone,
        "variant": variant,
        "title": result.title,
        "text": result.text,
        "mode": result.mode,
        "model": result.model,
        "badge": config.AI_BADGE,
        "generated_at": datetime.now(UTC),
    }


@router.get(
    "/explain/{context}",
    response_model=ExplainResponse,
    summary="Explica os números de uma tela",
)
def explain(
    context: Annotated[
        ExplainContext, Path(description="Tela: map, forecasts, point ou flood_area")
    ],
    point_id: Annotated[
        str | None, Query(pattern=POINT_ID_PATTERN, description='Obrigatório em "point"')
    ] = None,
    flood_area_id: Annotated[
        str | None,
        Query(pattern=FLOOD_AREA_ID_PATTERN, description='Obrigatório em "flood_area"'),
    ] = None,
    repo: Repository = Depends(get_repository),
    user: User = Depends(require_any_role),
) -> dict:
    """Texto curto, em linguagem simples, sobre o que os números dizem e o que fazer."""
    cache_key = context
    if context == "point":
        if not point_id:
            raise ValidationAppError('Informe point_id para o contexto "point".')
        point = repo.point(point_id)
        if point is None:
            raise NotFoundError("Ponto de descarte não encontrado.")
        facts = views.point_facts(repo, point)
        cache_key = f"point:{point_id}"
    elif context == "flood_area":
        if not flood_area_id:
            raise ValidationAppError('Informe flood_area_id para o contexto "flood_area".')
        area = next((a for a in repo.flood_areas() if a["id"] == flood_area_id), None)
        if area is None:
            raise NotFoundError("Área de alagamento não encontrada.")
        facts = views.flood_area_facts(repo, area)
        cache_key = f"flood_area:{flood_area_id}"
    elif context == "map":
        facts = views.map_facts(repo)
    else:
        facts = views.forecasts_facts(repo)

    if user.role == "visitante":
        # Visitante só lê o texto pronto: nenhuma chamada ao LLM é disparada por ele.
        title, text = text_templates.explain(context, facts)
        result = llm.TextResult(title=title, text=text, mode="fallback")
    else:
        result = llm.explain(context, facts, cache_key)
    return {
        "context": context,
        "facts": facts,
        "title": result.title,
        "text": result.text,
        "mode": result.mode,
        "model": result.model,
        "badge": config.AI_BADGE,
        "generated_at": datetime.now(UTC),
    }
