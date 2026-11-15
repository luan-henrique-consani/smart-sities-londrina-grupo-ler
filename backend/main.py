"""Aplicação FastAPI única da Prevora."""

from __future__ import annotations

import os
import re
import time
import uuid

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from backend import __version__
from backend.core import config
from backend.core.errors import AppError, error_response, register_error_handlers
from backend.core.logging import logger, request_id_var, setup_logging
from backend.core.security import visitor_write_guard
from backend.core.security_headers import apply_security_headers, csrf_valid
from backend.repositories import get_repository
from backend.routers import admin, ai, auth, health, logs, overview, points, privacy

_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9._-]{8,64}$")

DESCRIPTION = """
API de gestão preventiva de **resíduos** e **alagamentos** de Londrina (PR).
**Todos os dados são simulados.**

- **Sessão:** `POST /api/auth/login` grava um cookie httpOnly com JWT (8 h).
  As demais rotas exigem esse cookie, exceto `/api/health`, `/api/meta` e `/api/logs/client`.
- **Perfis (RBAC):** `admin`, `gestor`, `tecnico`, `defesa_civil` e `visitante` (somente leitura,
  entra por `POST /api/auth/visitor`, sem credenciais, sessão de 2 h).
- **Erros:** sempre `{"error": {"code", "message", "request_id"}}`.
- **Rastreamento:** toda resposta traz o cabeçalho `X-Request-ID`.
- **Escritas** (decisões, logs do cliente) ficam em memória e zeram no cold start.
"""


def _init_sentry() -> None:
    """Sentry é opcional: só liga com SENTRY_DSN e o pacote sentry-sdk instalado."""
    dsn = config.sentry_dsn()
    if not dsn:
        return
    try:
        import sentry_sdk

        sentry_sdk.init(dsn=dsn, send_default_pii=False, traces_sample_rate=0.0)
        logger.info("Sentry ativado")
    except ImportError:
        logger.warning("SENTRY_DSN definido, mas o pacote sentry-sdk não está instalado")


def create_app() -> FastAPI:
    setup_logging()
    app = FastAPI(
        title="Prevora — API",
        description=DESCRIPTION,
        version=__version__,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
        dependencies=[Depends(visitor_write_guard)],
    )
    register_error_handlers(app)
    # CORS restrito ao domínio do app (same-origin na Vercel; nada de "*").
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.allowed_origins(),
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Content-Type", "X-CSRF-Protection", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
        max_age=600,
    )
    # Compressão das respostas JSON grandes (listas de pontos, previsões).
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    _init_sentry()

    @app.middleware("http")
    async def request_context(request: Request, call_next) -> Response:
        """Define o request_id, registra o acesso e trata erros inesperados (500)."""
        incoming = request.headers.get("x-request-id", "")
        request_id = incoming if _REQUEST_ID_RE.match(incoming) else uuid.uuid4().hex
        request.state.request_id = request_id
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        try:
            try:
                if not csrf_valid(request):
                    logger.warning("CSRF recusado", extra={"path": request.url.path})
                    response = error_response(
                        403,
                        "csrf_failed",
                        "Requisição recusada por segurança. Recarregue a página e tente de novo.",
                        request_id=request_id,
                    )
                else:
                    response = await call_next(request)
            except Exception:  # noqa: BLE001 — último recurso: nunca expor stack trace
                logger.exception(
                    "erro inesperado",
                    extra={"method": request.method, "path": request.url.path},
                )
                response = error_response(
                    500, AppError.code, AppError.message, request_id=request_id
                )
            response.headers["X-Request-ID"] = request_id
            apply_security_headers(response, request.url.path)
            logger.info(
                "requisição",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    "user_id": getattr(request.state, "user_id", None),
                },
            )
            return response
        finally:
            request_id_var.reset(token)

    for router in (
        health.router,
        overview.public_router,
        auth.router,
        points.router,
        overview.router,
        ai.router,
        logs.router,
        privacy.router,
        admin.router,
    ):
        app.include_router(router, prefix="/api")

    # Carrega o seed na inicialização (arquivo ausente/corrompido → seed embutido + CRITICAL).
    get_repository()
    if not config.jwt_secret_configured():
        level = logger.critical if os.environ.get("VERCEL") else logger.warning
        level("JWT_SECRET não definido: usando segredo efêmero (as sessões caem a cada reinício)")
    return app


app = create_app()
