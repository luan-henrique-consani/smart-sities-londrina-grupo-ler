"""Aplicação FastAPI única da Londrina Limpa."""

from __future__ import annotations

from fastapi import FastAPI

from backend import __version__
from backend.routers import health


def create_app() -> FastAPI:
    app = FastAPI(
        title="Londrina Limpa — API",
        description=(
            "API de gestão preventiva de resíduos e alagamentos de Londrina (PR). "
            "Todos os dados são simulados."
        ),
        version=__version__,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
    )
    app.include_router(health.router, prefix="/api")
    return app


app = create_app()
