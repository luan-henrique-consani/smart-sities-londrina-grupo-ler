"""Entrada da função serverless Python na Vercel.

A Vercel carrega a variável `app` (ASGI). Todas as rotas /api/* são
reescritas para esta função (ver vercel.json).
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import app  # noqa: E402

__all__ = ["app"]
