"""Integridade e narrativa dos dados simulados em /data.

Os números são recalculados com os serviços a partir dos arquivos brutos,
para garantir que os indicadores gravados saem mesmo dos dados.
"""

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from backend.services import kpis
from backend.services.recurrence import is_chronic

DATA = Path(__file__).resolve().parents[1] / "data"
FILES = [
    "alerts.json",
    "areas.json",
    "cleanings.json",
    "drains.json",
    "episodes.json",
    "flood_areas.json",
    "flood_events.json",
    "forecasts.json",
    "kpis.json",
    "meta.json",
    "next3months.json",
    "points.json",
    "rain.json",
    "users.json",
    "yearly.json",
]


def load(name: str):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def data() -> dict:
    return {name.removesuffix(".json"): load(name) for name in FILES}


@pytest.fixture(scope="module")
def starts_by_point(data) -> dict:
    starts = defaultdict(list)
    for e in data["episodes"]:
        starts[e["point_id"]].append(datetime.fromisoformat(e["start"]))
    return starts


def test_all_files_exist_are_valid_and_small():
    total = 0
    for name in FILES:
        path = DATA / name
        assert path.is_file(), f"faltando: {name}"
        json.loads(path.read_text(encoding="utf-8"))
        total += path.stat().st_size
    assert total < 5_000_000


def test_meta_marks_data_as_simulated(data):
    meta = data["meta"]
    assert meta["simulated"] is True
    assert "simulados" in meta["notice"]
    assert "aproximadas" in meta["coordinates_notice"]
    assert datetime.fromisoformat(meta["generated_at"]).tzinfo is not None


def test_points_and_areas(data):
    points, areas = data["points"], data["areas"]
    assert len(points) == 300
    assert all(re.fullmatch(r"D-\d{4}", p["id"]) for p in points)
    assert len({p["id"] for p in points}) == 300
    area_ids = {a["id"] for a in areas}
    assert all(p["area_id"] in area_ids for p in points)
    names = {a["name"] for a in areas}
    assert {"Lago Igapó", "Jardim Quebec", "Centro", "Gleba Palhano", "Cinco Conjuntos"} <= names
    # Tudo dentro de Londrina (caixa aproximada) e marcado como aproximado.
    assert all(-23.45 < p["lat"] < -23.20 and -51.30 < p["lon"] < -51.05 for p in points)
    assert all(a["approximate"] for a in areas)


def test_episodes_respect_grouping_rule(data, starts_by_point):
    episodes = data["episodes"]
    assert 5_000 < len(episodes) < 20_000
    assert episodes[0]["start"] >= "2022-01-01"
    assert episodes[-1]["start"] <= data["forecasts"]["as_of"]
    assert all(e["reports"] >= 1 for e in episodes)
    assert any(e["reports"] > 1 for e in episodes)
    # No mesmo ponto, um episódio só começa mais de 48 h depois do fim do anterior.
    last_end = {}
    for e in episodes:
        start = datetime.fromisoformat(e["start"])
        previous = last_end.get(e["point_id"])
        if previous is not None:
            assert start - previous > timedelta(hours=48)
        last_end[e["point_id"]] = datetime.fromisoformat(e["end"])


def test_twelve_active_chronic_points(data, starts_by_point):
    as_of = datetime.fromisoformat(data["forecasts"]["as_of"])
    chronic = {pid for pid, starts in starts_by_point.items() if is_chronic(starts, as_of)}
    flagged = {p["point_id"] for p in data["forecasts"]["points"] if p["chronic"]}
    assert chronic == flagged
    assert len(chronic) == 12
    assert data["kpis"]["map"]["chronic_points"] == 12
    alerts = Counter(a["type"] for a in data["alerts"])
    assert alerts["chronic_recurrence"] == 12
    assert alerts["awareness"] == 12  # todo crônico gera alerta de conscientização


def test_three_flood_areas_at_high_risk_in_72h(data):
    areas = data["flood_areas"]
    assert 16 <= len(areas) <= 20
    high = [f for f in data["forecasts"]["flood_areas"] if f["risk"]["72h"]["level"] == "alto"]
    assert len(high) == 3
    names = {a["id"]: a["name"] for a in areas}
    assert any("Igapó" in names[f["flood_area_id"]] for f in high)
    assert data["kpis"]["map"]["high_risk_areas_72h"] == 3
    assert Counter(a["type"] for a in data["alerts"])["flood_high_risk"] == 3
    for f in data["forecasts"]["flood_areas"]:
        for horizon in ("now", "24h", "72h", "3m"):
            assert 0 <= f["risk"][horizon]["score"] <= 100
        assert f["risk"]["now"]["score"] <= f["risk"]["72h"]["score"] <= f["risk"]["3m"]["score"]


def test_point_forecasts_have_range_and_confidence(data):
    forecasts = data["forecasts"]["points"]
    assert len(forecasts) == 300
    with_next = [f for f in forecasts if f["next"]]
    assert len(with_next) > 250
    for f in with_next:
        assert 0 <= f["next"]["days_min"] < f["next"]["days_max"]
        assert f["next"]["confidence"] in {"alta", "média", "baixa"}
    assert {f["risk"] for f in forecasts} == {"alto", "médio", "baixo"}


def test_reference_kpis(data):
    impact = data["kpis"]["impact"]
    assert impact["recurrence"]["next_3_months_change_pct"] == -34
    assert impact["recurrence"]["after"] < impact["recurrence"]["before"]
    assert round(impact["days_clean"]["before"]) == 6
    assert round(impact["days_clean"]["after"]) == 11
    assert impact["days_to_clean"]["after"] < impact["days_to_clean"]["before"]
    assert impact["flood_accuracy"]["pct"] == 78
    assert impact["drains_before_rain"] == {
        "before_pct": 41,
        "after_pct": 82,
        "heavy_rain_mm": 30.0,
        "lead_days": 7,
    }
    assert impact["team_hours_saved"]["per_quarter"] == pytest.approx(1240, abs=25)


def test_kpis_can_be_recomputed_from_raw_files(data):
    """Os indicadores gravados batem com o recálculo a partir dos dados brutos."""
    impact = data["kpis"]["impact"]
    system_start = data["kpis"]["system_start"]
    post = [e["predicted"] for e in data["flood_events"] if e["date"] >= system_start]
    assert kpis.flood_hit_rate(post) == impact["flood_accuracy"]

    drain_ids = [d["id"] for d in data["drains"]]
    cleaned = defaultdict(list)
    for c in data["cleanings"]:
        if c["kind"] == "boca_de_lobo":
            cleaned[c["drain_id"]].append(datetime.fromisoformat(c["date"]).date())
    period = data["kpis"]["periods"]["after"]
    heavy = [
        datetime.fromisoformat(day).date()
        for day, mm in data["rain"]["observed"]
        if mm >= 30 and period["start"] <= day < period["end"]
    ]
    pct = kpis.drains_cleaned_before_rain(heavy, cleaned, drain_ids)
    assert round(pct) == impact["drains_before_rain"]["after_pct"]

    hours = [c["team_hours"] for c in data["cleanings"] if c["kind"] == "limpeza"]
    saved = impact["team_hours_saved"]
    assert sum(hours) / len(hours) == pytest.approx(saved["avg_team_hours_per_cleaning"], abs=0.01)
    assert saved["per_quarter"] == kpis.team_hours_saved(
        saved["avoided_cleanings"], saved["avg_team_hours_per_cleaning"]
    )


def test_seasonality_shows_in_the_data(data):
    by_month = Counter(e["start"][5:7] for e in data["episodes"] if e["start"] < "2026")
    typical = sorted(by_month.values())[6]
    assert by_month["12"] > 1.2 * typical  # festas de fim de ano
    # Semana do Carnaval de 2024 (10 a 13/02) contra uma semana comum de agosto.
    carnival = sum(1 for e in data["episodes"] if "2024-02-08" <= e["start"] < "2024-02-17")
    ordinary = sum(1 for e in data["episodes"] if "2024-08-08" <= e["start"] < "2024-08-17")
    assert carnival > 1.3 * ordinary
    floods = data["flood_events"]
    summer = sum(1 for e in floods if e["date"][5:7] in {"12", "01", "02", "03"})
    assert summer > 0.5 * len(floods)
    igapo = next(a["id"] for a in data["flood_areas"] if "Igapó" in a["name"])
    per_area = Counter(e["flood_area_id"] for e in floods)
    assert per_area.most_common(1)[0][0] == igapo


def test_improvement_after_system_start(data):
    by_year = {y["year"]: y for y in data["yearly"]}
    assert sorted(by_year) == [2022, 2023, 2024, 2025, 2026]
    assert by_year[2026]["partial"] is True
    current = by_year[2026]
    for year in (2022, 2023, 2024, 2025):
        past = by_year[year]
        assert current["jul_to_ref"]["recurrences"] < past["jul_to_ref"]["recurrences"]
        assert current["jul_to_ref"]["flood_events"] < past["jul_to_ref"]["flood_events"]
        assert current["avg_days_clean"] > past["avg_days_clean"]
        assert current["avg_days_to_clean"] < past["avg_days_to_clean"]


def test_next_three_months_comparison(data):
    nxt = data["next3months"]
    assert [m["month"] for m in nxt["months"]] == ["2026-12", "2027-01", "2027-02"]
    assert "Carnaval" in nxt["months"][2]["seasonal_events"]
    assert "Natal e Ano-Novo" in nxt["months"][0]["seasonal_events"]
    for month in nxt["months"]:
        for field in ("debris_episodes", "recurrences", "flood_events"):
            assert month[field]["with_plan"] < month[field]["without_action"]
    assert nxt["totals"]["recurrences"]["change_pct"] == -34
    assert nxt["team_hours_saved"] == data["kpis"]["impact"]["team_hours_saved"]["per_quarter"]


def test_alert_types(data):
    types = {a["type"] for a in data["alerts"]}
    assert types == {
        "flood_high_risk",
        "chronic_recurrence",
        "awareness",
        "seasonal_event",
        "debris_forecast",
    }
    assert len({a["id"] for a in data["alerts"]}) == len(data["alerts"])
    for alert in data["alerts"]:
        if alert["type"] == "awareness":
            assert len(alert["suggestions"]) == 4


def test_users_have_only_hashes(data):
    users = data["users"]
    assert {u["role"] for u in users} == {"admin", "gestor", "tecnico", "defesa_civil"}
    assert len(users) == 4
    for user in users:
        assert set(user) == {"id", "name", "email", "role", "job_title", "password_hash"}
        assert user["password_hash"].startswith("$argon2id$")
    raw = (DATA / "users.json").read_text(encoding="utf-8")
    assert "Limpa-" not in raw  # nenhuma senha em texto puro


def test_no_citizen_data_anywhere():
    """O sistema guarda o problema, não a pessoa."""
    forbidden = ("cpf", "telefone", "phone", "reporter", "cidadao_nome")
    for name in FILES:
        if name == "users.json":
            continue
        text = (DATA / name).read_text(encoding="utf-8").lower()
        assert not any(word in text for word in forbidden), name
