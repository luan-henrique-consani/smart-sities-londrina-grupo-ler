"""Logs estruturados em JSON no stdout, com request_id e mascaramento de dados pessoais."""

from __future__ import annotations

import json
import logging
import re
import sys
from collections import deque
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

from backend.core import config

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

MASK = "***"
SENSITIVE_KEYS = (
    "password",
    "senha",
    "token",
    "secret",
    "authorization",
    "cookie",
    "api_key",
    "apikey",
    "email",
    "e-mail",
    "name",
    "nome",
    "jwt",
)
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}")
_BEARER_RE = re.compile(r"(?i)\b(bearer|basic)\s+[A-Za-z0-9._~+/=-]{8,}")
_API_KEY_RE = re.compile(r"\bsk-[A-Za-z0-9_-]{8,}")
_KEY_VALUE_RE = re.compile(
    r"(?i)\b(password|senha|token|secret|api_key|apikey|authorization)\b(\s*[=:]\s*)(\"[^\"]*\"|\S+)"
)

_STANDARD_ATTRS = set(logging.LogRecord("x", 0, "x", 0, "", (), None).__dict__) | {
    "message",
    "asctime",
    "taskName",
}


def mask_text(text: str) -> str:
    """Mascara e-mails, tokens e senhas dentro de um texto livre."""
    text = _JWT_RE.sub(MASK, text)
    text = _BEARER_RE.sub(lambda m: f"{m.group(1)} {MASK}", text)
    text = _API_KEY_RE.sub(MASK, text)
    text = _KEY_VALUE_RE.sub(lambda m: f"{m.group(1)}{m.group(2)}{MASK}", text)
    return _EMAIL_RE.sub(MASK, text)


def _is_sensitive(key: str) -> bool:
    k = key.lower()
    if k in ("name", "nome"):
        return True
    return any(s in k for s in SENSITIVE_KEYS if s not in ("name", "nome")) or k.endswith(
        ("_name", "_nome")
    )


def mask_value(value: Any, key: str | None = None) -> Any:
    """Mascara dados pessoais: por chave (nome, e-mail, senha, token) e por padrão no texto."""
    if key is not None and _is_sensitive(key) and value is not None:
        return MASK
    if isinstance(value, dict):
        return {str(k): mask_value(v, str(k)) for k, v in value.items()}
    if isinstance(value, list | tuple | set):
        return [mask_value(v) for v in value]
    if isinstance(value, str):
        return mask_text(value)
    if isinstance(value, int | float | bool) or value is None:
        return value
    return mask_text(str(value))


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "time": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": mask_text(record.getMessage()),
            "request_id": request_id_var.get(),
        }
        for key, value in record.__dict__.items():
            if key not in _STANDARD_ATTRS and not key.startswith("_"):
                payload[key] = mask_value(value, key)
        if record.exc_info:
            payload["exception"] = mask_text(self.formatException(record.exc_info))
        return json.dumps(payload, ensure_ascii=False, default=str)


class ErrorBufferHandler(logging.Handler):
    """Guarda os últimos avisos e erros em memória (tela "Saúde do sistema")."""

    def __init__(self, maxlen: int = 50) -> None:
        super().__init__(level=logging.WARNING)
        self.records: deque[dict[str, Any]] = deque(maxlen=maxlen)
        self.counts: dict[str, int] = {}

    def emit(self, record: logging.LogRecord) -> None:
        self.counts[record.levelname] = self.counts.get(record.levelname, 0) + 1
        self.records.append(
            {
                "time": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="seconds"),
                "level": record.levelname,
                "message": mask_text(record.getMessage()),
                "request_id": request_id_var.get(),
            }
        )


error_buffer = ErrorBufferHandler()
logger = logging.getLogger("londrina_limpa")


def setup_logging() -> None:
    """Configura o logger da aplicação (idempotente)."""
    level = getattr(logging, config.log_level(), logging.INFO)
    logger.setLevel(level)
    if not any(isinstance(h, ErrorBufferHandler) for h in logger.handlers):
        stream = logging.StreamHandler(sys.stdout)
        stream.setFormatter(JsonFormatter())
        logger.addHandler(stream)
        logger.addHandler(error_buffer)
    logger.propagate = True  # permite captura em testes; o root não tem handlers em produção
