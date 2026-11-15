"""Modo Visitante: sessão real, somente leitura, 403 em escrita/privacidade/admin/IA."""

from __future__ import annotations

import jwt
import pytest
from fastapi.testclient import TestClient

from backend.core import config
from backend.core.security import client_log_limiter, login_limiter, visitor_limiter
from backend.main import app

CSRF = {"X-CSRF-Protection": "1"}
POINT = "D-0004"


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    for lim in (login_limiter, client_log_limiter, visitor_limiter):
        lim.reset()
    yield
    for lim in (login_limiter, client_log_limiter, visitor_limiter):
        lim.reset()


def visitor() -> TestClient:
    client = TestClient(app, base_url="https://testserver", headers=CSRF)
    res = client.post("/api/auth/visitor")
    assert res.status_code == 200, res.text
    return client


def staff(role: str, email: str, password: str) -> TestClient:
    client = TestClient(app, base_url="https://testserver", headers=CSRF)
    creds = {"email": email, "password": password}
    assert client.post("/api/auth/login", json=creds).status_code == 200
    return client


def test_visitor_session_is_real_httponly_and_short():
    client = TestClient(app, base_url="https://testserver", headers=CSRF)
    res = client.post("/api/auth/visitor")
    assert res.status_code == 200
    body = res.json()
    assert body["user"]["role"] == "visitante"
    assert body["user"]["email"] == ""
    assert body["consent"]["accepted"] is True  # sem termo a aceitar
    cookie = res.headers["set-cookie"].lower()
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie
    assert "max-age=7200" in cookie
    token = client.cookies[config.SESSION_COOKIE]
    claims = jwt.decode(token, config.jwt_secret(), algorithms=["HS256"])
    assert claims["role"] == "visitante"
    assert claims["exp"] - claims["iat"] == config.VISITOR_SESSION_HOURS * 3600
    me = client.get("/api/auth/me")
    assert me.status_code == 200 and me.json()["user"]["role"] == "visitante"


def test_visitor_entry_requires_csrf_header():
    client = TestClient(app, base_url="https://testserver")
    assert client.post("/api/auth/visitor").status_code == 403


@pytest.mark.parametrize(
    "path",
    [
        "/api/points",
        f"/api/points/{POINT}",
        "/api/flood-areas",
        "/api/alerts",
        "/api/kpis",
        "/api/forecasts/yearly",
        "/api/forecasts/next-3-months",
        "/api/forecasts/seasonal-calendar",
        "/api/ai/explain/map",
        "/api/ai/explain/forecasts",
        "/api/meta",
    ],
)
def test_visitor_can_read(path):
    assert visitor().get(path).status_code == 200


def test_visitor_explain_never_calls_llm(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "chave-falsa")

    def boom(*a, **k):
        raise AssertionError("LLM chamado por visitante")

    monkeypatch.setattr("backend.services.llm._call_claude", boom)
    res = visitor().get("/api/ai/explain/map")
    assert res.status_code == 200 and res.json()["mode"] == "fallback"


def test_visitor_write_endpoints_are_403():
    c = visitor()
    body = {"recommendation": "Limpar o ponto", "decision": "aceita", "intervention": "limpeza"}
    assert c.post(f"/api/points/{POINT}/decisions", json=body).status_code == 403
    aware = {"point_id": POINT, "material": "poster"}
    assert c.post("/api/ai/awareness", json=aware).status_code == 403
    # qualquer método de escrita, mesmo em rota inexistente/sem handler
    assert c.put(f"/api/points/{POINT}", json={}).status_code in (403, 405)
    assert c.delete(f"/api/points/{POINT}/decisions").status_code in (403, 404, 405)


def test_visitor_privacy_admin_and_audit_are_403():
    c = visitor()
    for method, path in [
        ("get", "/api/privacy/my-data"),
        ("delete", "/api/privacy/my-data"),
        ("post", "/api/privacy/consent"),
        ("get", "/api/admin/system-health"),
        ("get", "/api/admin/audit"),
    ]:
        kwargs = {"json": {"accepted": True, "version": "x"}} if method == "post" else {}
        res = getattr(c, method)(path, **kwargs)
        assert res.status_code == 403, (method, path, res.status_code)
        assert res.json()["error"]["code"] in ("forbidden",)


def test_visitor_does_not_see_decision_author_or_notes():
    admin = staff("admin", "admin@londrinalimpa.example", "Limpa-Admin-2026")
    body = {
        "recommendation": "Limpar o ponto",
        "decision": "aceita",
        "intervention": "limpeza",
        "notes": "conversar com fulano da rua X",
    }
    assert admin.post(f"/api/points/{POINT}/decisions", json=body).status_code == 201
    seen = visitor().get(f"/api/points/{POINT}").json()["decisions"]
    assert seen, "decisão registrada deve aparecer para o visitante"
    assert all(d["notes"] is None and d["created_by_id"] == "" for d in seen)
    own = admin.get(f"/api/points/{POINT}").json()["decisions"]
    assert any(d["notes"] for d in own)  # servidores continuam vendo tudo


def test_visitor_cannot_forge_staff_identity():
    forged = jwt.encode(
        {"sub": "U-01", "role": "visitante", "exp": 9999999999, "jti": "x" * 8},
        config.jwt_secret(),
        algorithm="HS256",
    )
    client = TestClient(app, base_url="https://testserver", headers=CSRF)
    client.cookies.set(config.SESSION_COOKIE, forged)
    assert client.get("/api/kpis").status_code == 401


def test_expired_visitor_session_is_401():
    expired = jwt.encode(
        {"sub": "visitante-abc", "role": "visitante", "exp": 1, "jti": "abcdefgh"},
        config.jwt_secret(),
        algorithm="HS256",
    )
    client = TestClient(app, base_url="https://testserver", headers=CSRF)
    client.cookies.set(config.SESSION_COOKIE, expired)
    res = client.get("/api/kpis")
    assert res.status_code == 401
    assert client.post("/api/auth/visitor").status_code == 200  # volta a poder entrar


def test_visitor_logout_revokes_session():
    c = visitor()
    token = c.cookies[config.SESSION_COOKIE]
    assert c.post("/api/auth/logout").status_code == 204
    c.cookies.set(config.SESSION_COOKIE, token)
    assert c.get("/api/kpis").status_code == 401


def test_visitor_entry_is_rate_limited_per_ip():
    statuses = []
    for _ in range(config.VISITOR_MAX_PER_MINUTE + 3):
        client = TestClient(app, base_url="https://testserver", headers=CSRF)  # sem cookie
        statuses.append(client.post("/api/auth/visitor").status_code)
    assert statuses[: config.VISITOR_MAX_PER_MINUTE] == [200] * config.VISITOR_MAX_PER_MINUTE
    assert statuses[-1] == 429


def test_visitor_session_reused_when_cookie_present():
    c = visitor()
    first = c.cookies[config.SESSION_COOKIE]
    for _ in range(40):  # não esgota o limite: reaproveita a sessão
        assert c.post("/api/auth/visitor").status_code == 200
    assert c.cookies[config.SESSION_COOKIE] == first


def test_staff_roles_unchanged():
    gestor = staff("gestor", "gestor@londrinalimpa.example", "Limpa-Gestor-2026")
    assert gestor.get("/api/privacy/my-data").status_code == 200
    aware = {"point_id": POINT, "material": "poster"}
    assert gestor.post("/api/ai/awareness", json=aware).status_code == 200
    admin = staff("admin", "admin@londrinalimpa.example", "Limpa-Admin-2026")
    assert admin.get("/api/admin/system-health").status_code == 200
