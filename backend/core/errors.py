"""Erros da API no formato padrão {"error": {"code", "message", "request_id"}}."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.core.logging import logger, request_id_var


class ErrorDetail(BaseModel):
    field: str
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str
    details: list[ErrorDetail] | None = None


class ErrorResponse(BaseModel):
    """Formato padrão de erro da API."""

    error: ErrorBody


class AppError(Exception):
    """Erro de negócio com código, mensagem amigável (pt-BR) e status HTTP."""

    status_code = 500
    code = "internal_error"
    message = "Ocorreu um erro inesperado. Tente novamente em instantes."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message or self.message)
        if message:
            self.message = message
        if code:
            self.code = code
        self.headers = headers


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"
    message = "Sessão expirada ou inexistente. Entre novamente."


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"
    message = "Seu perfil não tem permissão para esta ação."


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    message = "Recurso não encontrado."


class ValidationAppError(AppError):
    status_code = 422
    code = "validation_error"
    message = "Dados inválidos. Confira os campos e tente novamente."


class RateLimitedError(AppError):
    status_code = 429
    code = "rate_limited"
    message = "Muitas tentativas. Aguarde um pouco e tente novamente."


_STATUS_CODES = {
    400: ("bad_request", "Requisição inválida."),
    401: ("unauthorized", UnauthorizedError.message),
    403: ("forbidden", ForbiddenError.message),
    404: ("not_found", NotFoundError.message),
    405: ("method_not_allowed", "Método não permitido para este endereço."),
    413: ("payload_too_large", "Conteúdo grande demais."),
    429: ("rate_limited", RateLimitedError.message),
}

_VALIDATION_MESSAGES = {
    "missing": "Campo obrigatório.",
    "string_too_short": "Texto curto demais.",
    "string_too_long": "Texto longo demais.",
    "string_pattern_mismatch": "Formato inválido.",
    "literal_error": "Valor fora das opções permitidas.",
    "enum": "Valor fora das opções permitidas.",
    "int_parsing": "Informe um número inteiro.",
    "float_parsing": "Informe um número.",
    "greater_than_equal": "Valor abaixo do mínimo permitido.",
    "less_than_equal": "Valor acima do máximo permitido.",
    "date_from_datetime_parsing": "Data inválida (use AAAA-MM-DD).",
    "date_parsing": "Data inválida (use AAAA-MM-DD).",
    "json_invalid": "JSON inválido.",
    "extra_forbidden": "Campo não permitido.",
}


def error_response(
    status_code: int,
    code: str,
    message: str,
    *,
    request_id: str | None = None,
    details: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    rid = request_id or request_id_var.get()
    body: dict[str, Any] = {"code": code, "message": message, "request_id": rid}
    if details:
        body["details"] = details
    response = JSONResponse({"error": body}, status_code=status_code, headers=headers)
    response.headers["X-Request-ID"] = rid
    return response


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", None) or request_id_var.get()


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        level = "error" if exc.status_code >= 500 else "warning"
        getattr(logger, level)(
            "erro de aplicação", extra={"code": exc.code, "status": exc.status_code}
        )
        return error_response(
            exc.status_code,
            exc.code,
            exc.message,
            request_id=_request_id(request),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Nunca devolve nem registra o valor recebido (pode conter senha).
        details = [
            {
                "field": ".".join(str(p) for p in err.get("loc", ()) if p not in ("body",)),
                "message": _VALIDATION_MESSAGES.get(str(err.get("type")), "Valor inválido."),
            }
            for err in exc.errors()
        ]
        logger.warning(
            "entrada inválida", extra={"fields": [d["field"] for d in details], "status": 422}
        )
        return error_response(
            422,
            ValidationAppError.code,
            ValidationAppError.message,
            request_id=_request_id(request),
            details=details,
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        if exc.status_code >= 500:
            code, message = AppError.code, AppError.message
        else:
            code, message = _STATUS_CODES.get(
                exc.status_code, ("http_error", "Não foi possível concluir a requisição.")
            )
        return error_response(
            exc.status_code,
            code,
            message,
            request_id=_request_id(request),
            headers=dict(exc.headers) if exc.headers else None,
        )
