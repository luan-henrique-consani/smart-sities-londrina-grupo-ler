"""Fase 6: cabeçalhos, CSRF, CORS, LGPD (consentimento, exportação, exclusão), auditoria,
mascaramento de logs e saúde do sistema."""

from __future__ import annotations

import json
import logging

import pytest
from fastapi.testclient import TestClient

from backend.core import config
from backend.core.logging import JsonFormatter, mask_text, mask_value
from backend.core.security import client_log_limiter, login_limiter
from backend.main import app

CSRF = {"X-CSRF-Protection": "1"}
USERS = {
    "admin": ("admin@londrinalimpa.example", "Limpa-Admin-2026"),
    "gestor": ("gestor@londrinalimpa.example", "Limpa-Gestor-2026"),
    "tecnico": ("tecnico@londrinalimpa.example", "Limpa-Tecnico-2026"),
}


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    login_limiter.reset()
    client_log_limiter.reset()
    yield
    login_limiter.reset()
    client_log_limiter.reset()


def client_for(role: str | None = None, *, csrf: bool = True) -> TestClient:
    client = TestClient(app, base_url="https://testserver", headers=CSRF if csrf else {})
    if role:
        email, password = USERS[role]
        res = client.post("/api/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, res.text
    return client


# ---------- rotas protegidas ----------


@pytest.mark.parametrize(
    "path",
    [
        "/api/points",
        "/api/kpis",
        "/api/alerts",
        "/api/privacy/my-data",
        "/api/admin/system-health",
        "/api/admin/audit",
    ],
)
def test_protected_routes_without_cookie_are_401(path):
    res = client_for().get(path)
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "unauthorized"


@pytest.mark.parametrize("path", ["/api/admin/system-health", "/api/admin/audit"])
@pytest.mark.parametrize("role", ["gestor", "tecnico"])
def test_admin_routes_with_wrong_role_are_403(path, role):
    res = client_for(role).get(path)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "forbidden"


# ---------- cabeçalhos ----------


def test_security_headers_on_api_responses():
    res = client_for().get("/api/health")
    h = res.headers
    assert "max-age=" in h["strict-transport-security"]
    assert h["x-content-type-options"] == "nosniff"
    assert h["x-frame-options"] == "DENY"
    assert "frame-ancestors 'none'" in h["content-security-policy"]
    assert h["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in h["permissions-policy"]
    assert h["cache-control"] == "no-store"


def test_security_headers_also_on_errors():
    res = client_for().get("/api/nao-existe")
    assert res.status_code == 404
    assert res.headers["x-content-type-options"] == "nosniff"
    assert "frame-ancestors 'none'" in res.headers["content-security-policy"]


def test_docs_page_keeps_working_with_its_own_csp():
    res = client_for().get("/api/docs")
    assert res.status_code == 200
    assert "cdn.jsdelivr.net" in res.headers["content-security-policy"]
    assert "frame-ancestors 'none'" in res.headers["content-security-policy"]


# ---------- CORS ----------


def test_cors_allows_only_the_app_origin():
    client = client_for()
    ok = client.options(
        "/api/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    bad = client.options(
        "/api/health",
        headers={
            "Origin": "https://site-malicioso.example",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" not in bad.headers
    assert bad.headers.get("access-control-allow-origin") != "*"


# ---------- CSRF ----------


def test_post_without_csrf_header_is_rejected():
    email, password = USERS["admin"]
    client = client_for(csrf=False)
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "csrf_failed"
    assert "set-cookie" not in res.headers


def test_delete_without_csrf_header_is_rejected_even_with_session():
    client = client_for("admin")
    res = client.delete("/api/privacy/my-data", headers={"X-CSRF-Protection": ""})
    assert res.status_code == 403
    # a sessão continua de pé: nada foi apagado
    assert client.get("/api/auth/me").status_code == 200


def test_cookie_flags_and_logout_invalidates_token():
    email, password = USERS["gestor"]
    client = client_for()
    login = client.post("/api/auth/login", json={"email": email, "password": password})
    cookie = login.headers["set-cookie"].lower()
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie
    token = client.cookies.get(config.SESSION_COOKIE)
    client.post("/api/auth/logout")
    replay = client_for()
    replay.cookies.set(config.SESSION_COOKIE, token)
    assert replay.get("/api/auth/me").status_code == 401


# ---------- consentimento ----------


def test_consent_flow_is_recorded_and_survives_new_login():
    client = client_for("tecnico")
    me = client.get("/api/auth/me").json()
    assert me["consent"]["accepted"] is False
    assert me["consent"]["required_version"] == config.CONSENT_VERSION

    bad = client.post("/api/privacy/consent", json={"accepted": True, "version": "velha"})
    assert bad.status_code == 422
    refused = client.post(
        "/api/privacy/consent", json={"accepted": False, "version": config.CONSENT_VERSION}
    )
    assert refused.status_code == 422

    ok = client.post(
        "/api/privacy/consent", json={"accepted": True, "version": config.CONSENT_VERSION}
    )
    assert ok.status_code == 200
    me = client.get("/api/auth/me").json()
    assert me["consent"]["accepted"] is True
    assert me["consent"]["accepted_version"] == config.CONSENT_VERSION
    assert me["consent"]["accepted_at"]

    # novo login: o aceite registrado vale para a nova sessão (não pergunta de novo)
    again = client_for("tecnico").get("/api/auth/me").json()
    assert again["consent"]["accepted"] is True


# ---------- exportar e excluir ----------


def test_export_my_data_contains_only_own_data_and_is_audited():
    client = client_for("gestor")
    point = client.get("/api/points?page_size=1").json()["items"][0]["id"]
    dec = client.post(
        f"/api/points/{point}/decisions",
        json={"recommendation": "Ação porta a porta", "decision": "aceita"},
    )
    assert dec.status_code == 201
    other = client_for("tecnico")
    other.post(
        f"/api/points/{point}/decisions",
        json={"recommendation": "Outra", "decision": "adiada"},
    )

    res = client.get("/api/privacy/my-data")
    assert res.status_code == 200
    assert "attachment" in res.headers["content-disposition"]
    body = json.loads(res.text)
    assert body["subject"]["email"] == USERS["gestor"][0]
    assert "password_hash" not in res.text and "argon2" not in res.text
    own = body["subject"]["id"]
    assert body["decisions"] and all(d["created_by_id"] == own for d in body["decisions"])
    assert body["retention"] == {"ocorrencias": "5 anos", "logs_de_acesso": "6 meses"}
    # a própria exportação entra na trilha
    again = json.loads(client.get("/api/privacy/my-data").text)
    assert any(e["action"] == "exportacao_dados_pessoais" for e in again["audit_trail"])


def test_delete_my_data_registers_request_removes_store_data_and_ends_session():
    client = client_for("tecnico")
    point = client.get("/api/points?page_size=1").json()["items"][0]["id"]
    client.post(
        f"/api/points/{point}/decisions",
        json={"recommendation": "Fiscalizar no horário", "decision": "aceita"},
    )
    client.post(
        "/api/privacy/consent", json={"accepted": True, "version": config.CONSENT_VERSION}
    )

    res = client.delete("/api/privacy/my-data")
    assert res.status_code == 202
    body = res.json()
    assert body["id"].startswith("DEL-") and body["status"] == "registrado"
    assert body["removed"]["decisions"] >= 1 and body["removed"]["consents"] == 1
    # sessão encerrada e token revogado
    assert client.get("/api/auth/me").status_code == 401

    # login de novo: sem decisões antigas, sem consentimento, e o pedido continua registrado
    fresh = client_for("tecnico")
    assert fresh.get("/api/auth/me").json()["consent"]["accepted"] is False
    exported = json.loads(fresh.get("/api/privacy/my-data").text)
    assert exported["decisions"] == []
    assert any(r["id"] == body["id"] for r in exported["deletion_requests"])


# ---------- auditoria ----------


def test_audit_trail_records_actions_without_personal_data():
    client = client_for("admin")
    client.get("/api/privacy/my-data")
    res = client.get("/api/admin/audit")
    assert res.status_code == 200
    data = res.json()
    assert data["retention_days"] == config.AUDIT_RETENTION_DAYS
    actions = {e["action"] for e in data["items"]}
    assert {"login", "exportacao_dados_pessoais", "consulta_trilha_auditoria"} <= actions
    for entry in data["items"]:
        assert entry["request_id"]
        assert set(entry) <= {"time", "action", "user_id", "role", "resource", "request_id"}
    raw = res.text
    assert "@" not in raw and "Administrador Demo" not in raw


def test_audit_retention_purges_old_entries():
    from backend.repositories.memory_store import MemoryStore

    store = MemoryStore(audit_retention_days=183)
    store.add_audit({"time": "2020-01-01T00:00:00+00:00", "action": "antigo", "user_id": "U-01"})
    store.add_audit({"time": "2999-01-01T00:00:00+00:00", "action": "novo", "user_id": "U-01"})
    assert [e["action"] for e in store.audit_entries()] == ["novo"]


# ---------- saúde do sistema ----------


def test_system_health_for_admin():
    admin = client_for("admin")
    admin.post("/api/logs/client", json={"message": "falha de teste do navegador"})
    res = admin.get("/api/admin/system-health")
    assert res.status_code == 200
    h = res.json()
    assert h["version"] and h["uptime_seconds"] >= 0
    assert h["llm_mode"] == "fallback" and h["llm_model"] is None
    assert h["data_files"]["points"] == "ok"
    assert h["data_generated_at"]
    assert len(h["recent_errors"]) <= 20
    assert any("falha de teste" in c["message"] for c in h["recent_client_errors"])
    assert isinstance(h["error_counts"], dict)


# ---------- logs: mascaramento e validação ----------


def _format(message: str, **extra) -> dict:
    record = logging.LogRecord("londrina_limpa", logging.INFO, "x", 1, message, (), None)
    for k, v in extra.items():
        setattr(record, k, v)
    return json.loads(JsonFormatter().format(record))


def test_logs_never_contain_email_name_token_or_password():
    jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJVLTAxIn0.assinaturaAssinatura123"
    out = _format(
        f"login de gestor@londrinalimpa.example com senha=Limpa-Gestor-2026 token {jwt}",
        email="gestor@londrinalimpa.example",
        nome="Gestora Demo",
        password="Limpa-Gestor-2026",
        access_token=jwt,
        details={"user_name": "Fulana", "nested": {"authorization": "Bearer abcdefghijkl"}},
    )
    dumped = json.dumps(out, ensure_ascii=False)
    for secret in (
        "gestor@londrinalimpa.example",
        "Gestora Demo",
        "Limpa-Gestor-2026",
        jwt,
        "Fulana",
        "abcdefghijkl",
    ):
        assert secret not in dumped
    assert out["email"] == out["nome"] == out["password"] == "***"


def test_log_levels_and_request_id_present():
    out = _format("teste")
    assert out["level"] == "INFO" and "request_id" in out and out["time"]
    for level in ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"):
        assert hasattr(logging, level)


def test_mask_text_and_value_helpers():
    assert "@" not in mask_text("fale com ana@exemplo.com.br hoje")
    assert mask_text("password=hunter2 ok") == "password=*** ok"
    assert mask_value({"senha": "x", "ok": 1}) == {"senha": "***", "ok": 1}


def test_client_log_masks_and_validates_size():
    client = client_for()
    ok = client.post(
        "/api/logs/client",
        json={"message": "erro com ana@exemplo.com.br e token=abc123def456", "level": "error"},
    )
    assert ok.status_code == 202
    admin = client_for("admin")
    stored = admin.get("/api/admin/system-health").json()["recent_client_errors"]
    text = json.dumps(stored)
    assert "ana@exemplo.com.br" not in text and "abc123def456" not in text

    too_big = client.post("/api/logs/client", json={"message": "x" * 2001})
    assert too_big.status_code == 422
    huge_stack = client.post("/api/logs/client", json={"message": "x", "stack": "y" * 6001})
    assert huge_stack.status_code == 422
    unknown = client.post("/api/logs/client", json={"message": "x", "extra": 1})
    assert unknown.status_code == 422
    empty = client.post("/api/logs/client", json={"message": ""})
    assert empty.status_code == 422


def test_client_log_rate_limit():
    client = client_for()
    codes = [
        client.post("/api/logs/client", json={"message": f"erro {i}"}).status_code
        for i in range(config.CLIENT_LOG_MAX_PER_MINUTE + 2)
    ]
    assert codes[0] == 202 and codes[-1] == 429


# ---------- nenhum segredo no repositório ----------


def test_no_secrets_committed():
    import re
    import subprocess
    from pathlib import Path

    root = Path(__file__).resolve().parents[1]
    tracked = subprocess.run(
        ["git", "ls-files"], cwd=root, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    env_files = [f for f in tracked if re.search(r"(^|/)\.env($|\.)", f)]
    assert not [f for f in env_files if not f.endswith(".example")]
    pattern = re.compile(r"sk-ant-[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----")
    skip = {".png", ".jpg", ".ico", ".pdf", ".pptx", ".woff2", ".zip", ".mp4", ".webp"}
    for name in tracked:
        path = root / name
        if path.suffix.lower() in skip or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        assert not pattern.search(text), f"possível segredo em {name}"
    env_example = (root / ".env.example").read_text(encoding="utf-8")
    for line in env_example.splitlines():
        if "=" in line and not line.startswith("#"):
            assert line.split("=", 1)[1].strip() == "", f"valor em .env.example: {line}"
