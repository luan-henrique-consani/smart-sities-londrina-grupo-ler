"""Configuração central. Segredos vêm só de variáveis de ambiente."""

from __future__ import annotations

import os
from pathlib import Path

# Raiz do repositório (em produção, a raiz do bundle da função na Vercel).
ROOT_DIR = Path(__file__).resolve().parents[2]


def data_dir() -> Path:
    """Pasta dos JSON de seed (somente leitura na Vercel)."""
    override = os.environ.get("DATA_DIR")
    if override:
        return Path(override)
    candidate = ROOT_DIR / "data"
    if candidate.is_dir():
        return candidate
    return Path.cwd() / "data"
