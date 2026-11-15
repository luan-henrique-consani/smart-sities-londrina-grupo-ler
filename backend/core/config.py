"""Configuração central. Segredos vêm só de variáveis de ambiente."""

from __future__ import annotations

import os
import secrets
from pathlib import Path

# Raiz do repositório (em produção, a raiz do bundle da função na Vercel).
ROOT_DIR = Path(__file__).resolve().parents[2]

SESSION_COOKIE = "ll_session"
SESSION_HOURS = 8
JWT_ALGORITHM = "HS256"

LOGIN_MAX_FAILURES = 5  # tentativas falhas por IP...
LOGIN_WINDOW_SECONDS = 60  # ...por minuto
CLIENT_LOG_MAX_PER_MINUTE = 30

LLM_TIMEOUT_SECONDS = 15.0
LLM_DEFAULT_MODEL = "claude-opus-5-5"
AI_BADGE = "Gerado por IA · revise antes de usar"

# Segredo efêmero usado só quando JWT_SECRET não está definido (ver jwt_secret()).
_EPHEMERAL_SECRET = secrets.token_urlsafe(48)


def data_dir() -> Path:
    """Pasta dos JSON de seed (somente leitura na Vercel)."""
    override = os.environ.get("DATA_DIR")
    if override:
        return Path(override)
    candidate = ROOT_DIR / "data"
    if candidate.is_dir():
        return candidate
    return Path.cwd() / "data"


def jwt_secret_configured() -> bool:
    return bool(os.environ.get("JWT_SECRET", "").strip())


def jwt_secret() -> str:
    """Segredo do JWT. Sem JWT_SECRET, usa um segredo aleatório do processo.

    O segredo efêmero mantém o app funcionando em desenvolvimento, mas as
    sessões caem a cada reinício (e entre instâncias): em produção, defina
    JWT_SECRET.
    """
    return os.environ.get("JWT_SECRET", "").strip() or _EPHEMERAL_SECRET


def cookie_secure() -> bool:
    """Cookie de sessão sempre Secure, salvo COOKIE_SECURE=false (só para depuração)."""
    return os.environ.get("COOKIE_SECURE", "true").strip().lower() != "false"


def anthropic_api_key() -> str | None:
    return os.environ.get("ANTHROPIC_API_KEY", "").strip() or None


def anthropic_model() -> str:
    return os.environ.get("ANTHROPIC_MODEL", "").strip() or LLM_DEFAULT_MODEL


def log_level() -> str:
    return os.environ.get("LOG_LEVEL", "INFO").strip().upper()
