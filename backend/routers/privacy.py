"""LGPD: consentimento, exportação e exclusão dos dados do próprio servidor."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request, Response

from backend.core import config
from backend.core.errors import ErrorResponse, ValidationAppError
from backend.core.security import reissue_with_consent, require_staff, session_claims
from backend.models.schemas import Accepted, ConsentIn, DeletionRequest, MyDataResponse, User
from backend.repositories import Repository, get_repository
from backend.routers.auth import clear_cookie, set_cookie
from backend.routers.common import AUTH_ERRORS
from backend.services.audit import record_audit

# Privacidade/LGPD é dos servidores: o visitante (sem dados pessoais) recebe 403.
router = APIRouter(prefix="/privacy", tags=["privacidade (LGPD)"], responses=AUTH_ERRORS)

RETENTION = {
    "ocorrencias": f"{config.RECORDS_RETENTION_YEARS} anos",
    "logs_de_acesso": f"{config.AUDIT_RETENTION_DAYS // 30} meses",
}


@router.post(
    "/consent",
    response_model=Accepted,
    summary="Aceita o Termo de Consentimento",
    responses={422: {"model": ErrorResponse, "description": "Versão do termo desatualizada"}},
)
def accept_consent(
    body: ConsentIn,
    request: Request,
    response: Response,
    user: User = Depends(require_staff),
    repo: Repository = Depends(get_repository),
) -> Accepted:
    """Registra data e versão do aceite e o grava também na sessão (o JWT leva a versão aceita)."""
    if body.version != config.CONSENT_VERSION:
        raise ValidationAppError(
            "O termo foi atualizado. Recarregue a página e leia a versão vigente."
        )
    now = datetime.now(UTC)
    accepted_at = now.isoformat(timespec="seconds")
    repo.set_consent(user.id, {"version": body.version, "accepted_at": accepted_at})
    set_cookie(response, reissue_with_consent(session_claims(request), body.version, now))
    record_audit(
        repo,
        request,
        "consentimento_aceito",
        user_id=user.id,
        role=user.role,
        resource=f"termo:{body.version}",
    )
    return Accepted()


@router.get("/my-data", response_model=MyDataResponse, summary="Exporta os próprios dados (JSON)")
def my_data(
    request: Request,
    user: User = Depends(require_staff),
    repo: Repository = Depends(get_repository),
) -> Response:
    """Tudo o que o sistema guarda sobre o servidor logado: cadastro, consentimento, decisões
    registradas, trilha de acesso e pedidos de exclusão. A exportação também é auditada."""
    record_audit(
        repo,
        request,
        "exportacao_dados_pessoais",
        user_id=user.id,
        role=user.role,
        resource=f"usuario:{user.id}",
    )
    payload = MyDataResponse(
        generated_at=datetime.now(UTC).isoformat(timespec="seconds"),
        subject={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "job_title": user.job_title,
        },
        consent=repo.consent_for(user.id),
        decisions=[
            {**d, "created_at": str(d.get("created_at"))} for d in repo.decisions_by_user(user.id)
        ],
        audit_trail=repo.audit_entries(user.id),
        deletion_requests=repo.deletion_requests(user.id),
        retention=RETENTION,
        notice=(
            "O sistema guarda o problema, não a pessoa: não há dados de cidadãos. "
            "Dados do servidor: nome, e-mail, cargo e a trilha de acesso."
        ),
    )
    return Response(
        content=payload.model_dump_json(indent=2),
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="meus-dados-prevora.json"'},
    )


@router.delete(
    "/my-data",
    response_model=DeletionRequest,
    status_code=202,
    summary="Pede a exclusão dos próprios dados",
)
def delete_my_data(
    request: Request,
    response: Response,
    user: User = Depends(require_staff),
    repo: Repository = Depends(get_repository),
) -> DeletionRequest:
    """Registra o pedido, remove do store em memória as decisões e o consentimento do usuário
    e encerra a sessão. O cadastro do seed (somente leitura) e a trilha de auditoria seguem a
    política de retenção; a remoção definitiva da conta é feita pelo encarregado (ver LGPD.md)."""
    removed = repo.delete_user_data(user.id)
    record = repo.add_deletion_request(
        {
            "user_id": user.id,
            "requested_at": datetime.now(UTC).isoformat(timespec="seconds"),
            "status": "registrado",
            "removed": removed,
            "note": "Cadastro de origem (seed) e trilha de auditoria seguem a retenção.",
        }
    )
    record_audit(
        repo,
        request,
        "pedido_exclusao_dados",
        user_id=user.id,
        role=user.role,
        resource=record["id"],
    )
    claims = session_claims(request)
    repo.revoke_token(str(claims["jti"]), float(claims.get("exp", 0)))
    clear_cookie(response)
    return DeletionRequest.model_validate(record)
