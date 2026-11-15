"""Cabeçalhos de segurança da API e proteção CSRF."""

from __future__ import annotations

from starlette.requests import Request
from starlette.responses import Response

from backend.core import config

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# A API só devolve JSON: nada pode ser carregado nem embutido a partir dela.
_API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
# /api/docs (Swagger UI) carrega scripts e estilos do jsDelivr.
_DOCS_CSP = (
    "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "img-src 'self' data: https://fastapi.tiangolo.com; connect-src 'self'; "
    "frame-ancestors 'none'; base-uri 'none'"
)

BASE_HEADERS = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}


def apply_security_headers(response: Response, path: str) -> None:
    for key, value in BASE_HEADERS.items():
        response.headers.setdefault(key, value)
    is_docs = path.rstrip("/") == "/api/docs"
    response.headers.setdefault("Content-Security-Policy", _DOCS_CSP if is_docs else _API_CSP)
    if path.startswith("/api/") and not is_docs:
        response.headers.setdefault("Cache-Control", "no-store")


def csrf_valid(request: Request) -> bool:
    """Métodos que alteram estado exigem o cabeçalho customizado (ver config.CSRF_HEADER)."""
    if request.method in SAFE_METHODS:
        return True
    return request.headers.get(config.CSRF_HEADER) == config.CSRF_VALUE
