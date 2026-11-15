"""Utilidades comuns das rotas: paginação e respostas de erro documentadas."""

from __future__ import annotations

from math import ceil
from typing import Any

from backend.core.errors import ErrorResponse

AUTH_ERRORS: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Sem sessão ou sessão expirada"},
    403: {"model": ErrorResponse, "description": "Perfil sem permissão"},
    422: {"model": ErrorResponse, "description": "Entrada inválida"},
}
NOT_FOUND: dict[int | str, dict[str, Any]] = {
    404: {"model": ErrorResponse, "description": "Recurso não encontrado"},
}
RATE_LIMITED: dict[int | str, dict[str, Any]] = {
    429: {"model": ErrorResponse, "description": "Limite de tentativas atingido"},
}


def paginate(items: list[Any], page: int, page_size: int) -> dict[str, Any]:
    total = len(items)
    start = (page - 1) * page_size
    return {
        "items": items[start : start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, ceil(total / page_size)),
    }
