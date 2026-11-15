"""Camada Repository: todo acesso a dados passa por aqui."""

from __future__ import annotations

from functools import lru_cache

from backend.core.config import data_dir
from backend.repositories.base import Record, Repository
from backend.repositories.json_repository import JsonRepository
from backend.repositories.memory_store import MemoryStore

__all__ = ["JsonRepository", "MemoryStore", "Record", "Repository", "get_repository"]


@lru_cache(maxsize=1)
def get_repository() -> Repository:
    """Repositório único do processo (dependência do FastAPI).

    Para trocar por PostgreSQL, basta devolver outra implementação aqui.
    """
    return JsonRepository(data_dir())
