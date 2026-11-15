"""Testes de integração da API: auth, RBAC, erros, rotas principais e fallback do LLM."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.core import config
from backend.core.security import client_log_limiter, login_limiter
from backend.main import app
from backend.repositories import get_repository

PASSWORDS = {
    "admin": ("admin@londrinalimpa.example", "Limpa-Admin-2026"),
    "gestor": ("gestor@londrinalimpa.example", "Limpa-Gestor-2026"),
    "tecnico": ("tecnico@londrinalimpa.example", "Limpa-Tecnico-2026"),
    "defesa_civil": ("defesa@londrinalimpa.example", "Limpa-Defesa-2026"),
}
POINT = "D-0004"


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    login_limiter.reset()
    client_log_limiter.reset()
    yield
    login_limiter.reset()
    client_log_limiter.reset()


def make_client(role: str | None = None) -> TestClient:
    # https: o cookie de sessão é Secure e o cliente só o reenvia em HTTPS.
    client = TestClient(app, base_url="https://testserver")
    if role:
        email, password = PASSWORDS[role]
        res = client.post("/api/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, res.text
    return client


def assert_error(res, status: int, code: str | None = None) -> None:
    assert res.status_code == status, res.text
    err = res.json()["error"]
    assert set(err) >= {"code", "message", "request_id"}
    assert err["request_id"] == res.headers["X-Request-ID"]
    assert "Traceback" not in res.text
    if code:
        assert err["code"] == code


# ---------- autenticação ----------


@pytest.mark.parametrize("role", list(PASSWORDS))
def test_login_ok_sets_secure_cookie_and_me(role):
    client = TestClient(app, base_url="https://testserver")
    email, password = PASSWORDS[role]
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    body = res.json()
    assert body["user"]["role"] == role
    assert "password" not in res.text and "hash" not in res.text
    cookie = res.headers["set-cookie"].lower()
    assert config.SESSION_COOKIE in cookie
    assert "httponly" in cookie and "secure" in cookie and "samesite=lax" in cookie
    assert f"max-age={8 * 3600}" in cookie
    me = client.get("/api/auth/me")
    assert me.status_code == 200 and me.json()["user"]["role"] == role


def test_login_wrong_password_and_unknown_user_look_the_same():
    client = make_client()
    wrong = client.post(
        "/api/auth/login", json={"email": PASSWORDS["admin"][0], "password": "errada-123"}
    )
    unknown = client.post(
        "/api/auth/login", json={"email": "ninguem@londrinalimpa.example", "password": "x-12345"}
    )
    assert_error(wrong, 401, "invalid_credentials")
    assert_error(unknown, 401, "invalid_credentials")
    assert wrong.json()["error"]["message"] == unknown.json()["error"]["message"]
    assert "set-cookie" not in wrong.headers


def test_login_invalid_input_is_422_without_echoing_password():
    client = make_client()
    res = client.post("/api/auth/login", json={"email": "nao-e-email", "password": "segredo-xyz"})
    assert_error(res, 422, "validation_error")
    assert "segredo-xyz" not in res.text
    assert_error(client.post("/api/auth/login", json={}), 422)


def test_login_rate_limit_429_after_5_failures():
    client = make_client()
    bad = {"email": PASSWORDS["admin"][0], "password": "errada-123"}
    for _ in range(5):
        assert client.post("/api/auth/login", json=bad).status_code == 401
    res = client.post("/api/auth/login", json=bad)
    assert_error(res, 429, "rate_limited")
    assert int(res.headers["Retry-After"]) >= 1
    # mesmo a senha certa fica bloqueada durante a janela
    good = client.post(
        "/api/auth/login",
        json={"email": PASSWORDS["admin"][0], "password": PASSWORDS["admin"][1]},
    )
    assert good.status_code == 429


def test_logout_revokes_token_and_clears_cookie():
    client = make_client("gestor")
    token = client.cookies.get(config.SESSION_COOKIE)
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    # o token antigo, reapresentado, continua inválido (revogado)
    replay = TestClient(app, base_url="https://testserver")
    replay.cookies.set(config.SESSION_COOKIE, token)
    assert_error(replay.get("/api/auth/me"), 401)


def test_invalid_and_tampered_tokens_are_401():
    client = make_client()
    client.cookies.set(config.SESSION_COOKIE, "isto.nao.e-um-jwt")
    assert_error(client.get("/api/points"), 401, "unauthorized")


def test_expired_token_is_401(monkeypatch):
    import jwt as pyjwt

    expired = pyjwt.encode(
        {"sub": "U-01", "role": "admin", "exp": 1, "jti": "abc"},
        config.jwt_secret(),
        algorithm=config.JWT_ALGORITHM,
    )
    client = make_client()
    client.cookies.set(config.SESSION_COOKIE, expired)
    assert_error(client.get("/api/kpis"), 401)


# ---------- RBAC ----------

PROTECTED_GET = [
    "/api/points",
    f"/api/points/{POINT}",
    "/api/flood-areas",
    "/api/alerts",
    "/api/kpis",
    "/api/forecasts/yearly",
    "/api/forecasts/next-3-months",
    "/api/forecasts/seasonal-calendar",
    "/api/ai/explain/map",
    "/api/auth/me",
]


@pytest.mark.parametrize("path", PROTECTED_GET)
def test_protected_routes_without_cookie_are_401(path):
    assert_error(make_client().get(path), 401, "unauthorized")


def test_protected_post_routes_without_cookie_are_401():
    client = make_client()
    body = {"recommendation": "Limpar o ponto", "decision": "aceita"}
    assert_error(client.post(f"/api/points/{POINT}/decisions", json=body), 401)
    assert_error(
        client.post("/api/ai/awareness", json={"point_id": POINT, "material": "poster"}), 401
    )


@pytest.mark.parametrize("role", list(PASSWORDS))
@pytest.mark.parametrize("path", PROTECTED_GET[:-1])
def test_every_role_can_read(role, path):
    assert make_client(role).get(path).status_code == 200


def test_decisions_rbac():
    body = {"recommendation": "Limpar o ponto", "decision": "aceita", "intervention": "limpeza"}
    for role in ("admin", "gestor", "tecnico"):
        res = make_client(role).post(f"/api/points/{POINT}/decisions", json=body)
        assert res.status_code == 201, (role, res.text)
        assert res.json()["point_id"] == POINT
    assert_error(
        make_client("defesa_civil").post(f"/api/points/{POINT}/decisions", json=body),
        403,
        "forbidden",
    )


def test_awareness_rbac():
    body = {"point_id": POINT, "material": "poster"}
    for role in ("admin", "gestor"):
        assert make_client(role).post("/api/ai/awareness", json=body).status_code == 200
    for role in ("tecnico", "defesa_civil"):
        assert_error(make_client(role).post("/api/ai/awareness", json=body), 403, "forbidden")


# ---------- erros 404 / 422 / 405 ----------


def test_not_found_cases():
    client = make_client("admin")
    assert_error(client.get("/api/points/D-9999"), 404, "not_found")
    assert_error(client.get("/api/rota-que-nao-existe"), 404, "not_found")
    assert_error(
        client.post(
            "/api/points/D-9999/decisions",
            json={"recommendation": "Limpar", "decision": "aceita"},
        ),
        404,
    )
    assert_error(
        client.post("/api/ai/awareness", json={"point_id": "D-9999", "material": "poster"}), 404
    )
    assert_error(client.get("/api/ai/explain/flood_area?flood_area_id=A-99"), 404)


def test_validation_errors_422():
    client = make_client("admin")
    assert_error(client.get("/api/points?type=inexistente"), 422, "validation_error")
    assert_error(client.get("/api/points?page=0"), 422)
    assert_error(client.get("/api/points?page_size=100000"), 422)
    assert_error(client.get("/api/points/abc"), 422)
    assert_error(client.get("/api/flood-areas?horizon=10y"), 422)
    assert_error(client.get("/api/ai/explain/point"), 422)  # falta point_id
    inverted = "/api/forecasts/seasonal-calendar?start=2027-02-01&end=2027-01-01"
    assert_error(client.get(inverted), 422)
    assert_error(
        client.post(
            f"/api/points/{POINT}/decisions", json={"recommendation": "x", "decision": "talvez"}
        ),
        422,
    )
    assert_error(
        client.post("/api/ai/awareness", json={"point_id": POINT, "material": "meme"}), 422
    )
    res = client.post(
        "/api/ai/awareness", json={"point_id": POINT, "material": "poster", "extra": 1}
    )
    assert_error(res, 422)  # campos desconhecidos são recusados


def test_method_not_allowed_uses_standard_format():
    assert_error(make_client("admin").delete("/api/kpis"), 405, "method_not_allowed")


def test_unexpected_error_is_500_without_stack_trace():
    from fastapi import APIRouter

    boom = APIRouter()

    @boom.get("/api/_boom")
    def _boom():
        raise RuntimeError("segredo interno")

    app.include_router(boom)
    client = TestClient(app, base_url="https://testserver", raise_server_exceptions=False)
    res = client.get("/api/_boom")
    assert_error(res, 500, "internal_error")
    assert "segredo interno" not in res.text


def test_request_id_header_is_generated_and_propagated():
    client = make_client()
    assert client.get("/api/health").headers["X-Request-ID"]
    res = client.get("/api/health", headers={"X-Request-ID": "meu-id-de-teste-01"})
    assert res.headers["X-Request-ID"] == "meu-id-de-teste-01"
    # id malformado é descartado
    bad = client.get("/api/health", headers={"X-Request-ID": "x y\nz"})
    assert bad.headers["X-Request-ID"] != "x y\nz"


# ---------- rotas principais ----------


def test_meta_is_public_and_flags_simulation():
    res = make_client().get("/api/meta")
    assert res.status_code == 200
    body = res.json()
    assert body["generated_at"]
    assert "simulad" in res.text.lower()


def test_points_list_filters_and_pagination():
    client = make_client("gestor")
    page = client.get("/api/points?page_size=10").json()
    assert len(page["items"]) == 10
    assert page["total"] >= 100 and page["pages"] >= 10
    entulho = client.get("/api/points?type=entulho&page_size=500").json()
    assert entulho["items"] and all(p["waste_type"] == "entulho" for p in entulho["items"])
    chronic = client.get("/api/points?chronic=true&page_size=500").json()
    assert chronic["items"]
    area = entulho["items"][0]["area_id"]
    in_area = client.get(f"/api/points?area={area}&page_size=500").json()
    assert in_area["items"] and all(p["area_id"] == area for p in in_area["items"])
    # página além do fim → lista vazia, não erro
    assert client.get("/api/points?page=9999").json()["items"] == []


def test_point_detail_has_history_forecast_and_status():
    res = make_client("tecnico").get(f"/api/points/{POINT}")
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == POINT
    for key in ("episodes", "cleanings"):
        assert isinstance(body[key], list)
    limited = make_client("tecnico").get(f"/api/points/{POINT}?episodes_limit=1").json()
    assert len(limited["episodes"]) <= 1


@pytest.mark.parametrize("horizon", ["now", "24h", "72h", "3m"])
def test_flood_areas_by_horizon(horizon):
    body = make_client("defesa_civil").get(f"/api/flood-areas?horizon={horizon}").json()
    assert body["horizon"] == horizon
    assert body["total"] == len(body["items"]) >= 10
    scores = [i["score"] for i in body["items"]]
    assert scores == sorted(scores, reverse=True)
    assert all(0 <= s <= 100 for s in scores)
    assert {i["level"] for i in body["items"]} <= {"baixo", "médio", "alto"}


def test_alerts_filter_and_kpis_and_forecasts():
    client = make_client("gestor")
    alerts = client.get("/api/alerts?page_size=200").json()
    assert alerts["total"] > 0
    only = client.get("/api/alerts?type=flood_high_risk").json()
    assert all(a["type"] == "flood_high_risk" for a in only["items"])
    assert client.get("/api/kpis").json()
    years = client.get("/api/forecasts/yearly").json()["years"]
    assert [y["year"] for y in years] == [2022, 2023, 2024, 2025, 2026]
    nxt = client.get("/api/forecasts/next-3-months").json()
    assert nxt
    cal = client.get("/api/forecasts/seasonal-calendar?start=2026-12-01&end=2027-03-01").json()
    names = " ".join(e["name"] for e in cal["events"]).lower()
    assert "carnaval" in names and "natal" in names


def test_decision_is_stored_in_memory_store():
    client = make_client("gestor")
    body = {
        "recommendation": "Instalar placa e fiscalizar",
        "decision": "aceita",
        "intervention": "placa",
        "planned_date": "2026-11-20",
        "notes": "Combinado com a CMTU",
    }
    res = client.post(f"/api/points/{POINT}/decisions", json=body)
    assert res.status_code == 201
    created = res.json()
    assert created["id"] and created["decision"] == "aceita"
    assert created["created_by_role"] == "gestor"


# ---------- LLM / fallback ----------


@pytest.mark.parametrize("material", ["poster", "social", "door_to_door", "action_plan"])
@pytest.mark.parametrize("audience", ["moradores", "comerciantes", "escolas", "geral"])
def test_awareness_fallback_without_key(material, audience):
    res = make_client("gestor").post(
        "/api/ai/awareness",
        json={"point_id": POINT, "material": material, "audience": audience, "tone": "direto"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["mode"] == "fallback" and body["model"] is None
    assert body["badge"] == "Gerado por IA · revise antes de usar"
    assert body["title"] and len(body["text"]) > 80
    assert body["point_id"] == POINT


def test_awareness_variants_differ():
    client = make_client("gestor")
    texts = {
        client.post(
            "/api/ai/awareness", json={"point_id": POINT, "material": "social", "variant": v}
        ).json()["text"]
        for v in (0, 1, 2)
    }
    assert len(texts) > 1


@pytest.mark.parametrize("context", ["map", "forecasts"])
def test_explain_fallback(context):
    body = make_client("defesa_civil").get(f"/api/ai/explain/{context}").json()
    assert body["mode"] == "fallback" and body["text"]
    assert body["badge"] == config.AI_BADGE


def test_explain_point_and_flood_area():
    client = make_client("admin")
    point = client.get(f"/api/ai/explain/point?point_id={POINT}")
    assert point.status_code == 200 and point.json()["mode"] == "fallback"
    area_id = client.get("/api/flood-areas").json()["items"][0]["id"]
    area = client.get(f"/api/ai/explain/flood_area?flood_area_id={area_id}")
    assert area.status_code == 200 and area.json()["text"]


def test_llm_errors_fall_back_automatically(monkeypatch):
    """Com chave definida mas a API falhando (timeout/erro), o texto vem do fallback."""
    import anthropic

    monkeypatch.setenv("ANTHROPIC_API_KEY", "chave-de-teste")

    class Boom:
        def __init__(self, *a, **k):
            pass

        @property
        def messages(self):
            raise anthropic.APITimeoutError(request=None)  # type: ignore[arg-type]

    monkeypatch.setattr(anthropic, "Anthropic", Boom)
    res = make_client("gestor").post(
        "/api/ai/awareness", json={"point_id": POINT, "material": "poster"}
    )
    assert res.status_code == 200
    assert res.json()["mode"] == "fallback" and res.json()["text"]


def test_llm_api_mode_and_no_personal_data_sent(monkeypatch):
    import types

    import anthropic

    monkeypatch.setenv("ANTHROPIC_API_KEY", "chave-de-teste")
    monkeypatch.setenv("ANTHROPIC_MODEL", "modelo-de-teste")
    sent: dict = {}

    class FakeMessages:
        def create(self, **kwargs):
            sent.update(kwargs)
            block = types.SimpleNamespace(type="text", text="Título de teste\n\nCorpo do texto.")
            return types.SimpleNamespace(content=[block], stop_reason="end_turn")

    class FakeClient:
        def __init__(self, **kwargs):
            sent["client_kwargs"] = kwargs
            self.messages = FakeMessages()

    monkeypatch.setattr(anthropic, "Anthropic", FakeClient)
    res = make_client("gestor").post(
        "/api/ai/awareness", json={"point_id": POINT, "material": "poster"}
    )
    body = res.json()
    assert body["mode"] == "api" and body["model"] == "modelo-de-teste"
    assert body["title"] == "Título de teste" and body["text"] == "Corpo do texto."
    assert sent["client_kwargs"]["timeout"] == 15.0
    payload = str(sent)
    for forbidden in ("@londrinalimpa", "Limpa-", "password", "email"):
        assert forbidden not in payload


# ---------- logs do cliente ----------


def test_client_log_is_public_masked_and_validated():
    client = make_client()
    res = client.post(
        "/api/logs/client",
        json={
            "message": "falhou para maria@exemplo.com com token=abc123",
            "component": "Mapa",
        },
    )
    assert res.status_code == 202
    entry = get_repository().client_logs()[-1]
    assert "maria@exemplo.com" not in entry["message"]
    assert "abc123" not in entry["message"]
    assert_error(client.post("/api/logs/client", json={"message": ""}), 422)
    assert_error(client.post("/api/logs/client", json={"message": "x" * 5000}), 422)


def test_client_log_rate_limit():
    client = make_client()
    for _ in range(config.CLIENT_LOG_MAX_PER_MINUTE):
        assert client.post("/api/logs/client", json={"message": "erro"}).status_code == 202
    assert_error(client.post("/api/logs/client", json={"message": "erro"}), 429, "rate_limited")


# ---------- docs e prontidão para Vercel ----------


def test_openapi_documents_every_route():
    schema = make_client().get("/api/openapi.json").json()
    paths = schema["paths"]
    expected = {
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/me",
        "/api/points",
        "/api/points/{point_id}",
        "/api/points/{point_id}/decisions",
        "/api/flood-areas",
        "/api/alerts",
        "/api/kpis",
        "/api/forecasts/yearly",
        "/api/forecasts/next-3-months",
        "/api/forecasts/seasonal-calendar",
        "/api/ai/awareness",
        "/api/ai/explain/{context}",
        "/api/meta",
        "/api/health",
        "/api/logs/client",
    }
    assert expected <= set(paths)
    for path in expected:
        for op in paths[path].values():
            assert op.get("summary"), path


def test_vercel_entrypoint_exposes_asgi_app():
    from api.index import app as vercel_app

    assert vercel_app is app


def test_vercel_config_bundles_seed_and_rewrites_api():
    import json

    cfg = json.loads((config.ROOT_DIR / "vercel.json").read_text(encoding="utf-8"))
    fn = cfg["functions"]["api/index.py"]
    assert fn["includeFiles"] == "data/**"
    assert {"source": "/api/(.*)", "destination": "/api/index"} in cfg["rewrites"]
