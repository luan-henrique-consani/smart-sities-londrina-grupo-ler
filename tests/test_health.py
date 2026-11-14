from datetime import datetime

from fastapi.testclient import TestClient

from backend import __version__
from backend.main import app

client = TestClient(app)


def test_health_ok():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert set(body) == {"status", "version", "time"}
    assert body["status"] == "ok"
    assert body["version"] == __version__
    assert datetime.fromisoformat(body["time"]).tzinfo is not None


def test_health_degraded_without_data(monkeypatch, tmp_path):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "degraded"


def test_docs_and_openapi_under_api():
    assert client.get("/api/docs").status_code == 200
    schema = client.get("/api/openapi.json")
    assert schema.status_code == 200
    assert "/api/health" in schema.json()["paths"]
