"""Monta as visões da API (pontos, áreas de alagamento, fatos para os textos).

Só lê pelo Repository; os números vêm dos modelos pré-calculados e das
regras de negócio dos outros serviços.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from statistics import mean
from typing import Any

from backend.repositories import Record, Repository
from backend.services.geo import haversine_m
from backend.services.recurrence import DEFAULT_MIN_EPISODES, DEFAULT_WINDOW_DAYS

RISK_ORDER = {"alto": 0, "médio": 1, "baixo": 2}
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "info": 3}
HORIZON_DAYS = {"24h": 1, "72h": 3, "3m": 90}
FLOOD_LINK_MARGIN_M = 200.0
WASTE_LABELS = {
    "entulho": "entulho",
    "volumosos": "móveis e volumosos",
    "domestico": "lixo doméstico",
    "poda": "restos de poda",
    "misto": "resíduos mistos",
    "pneus": "pneus",
}


def hour_label(start_hour: int, end_hour: int) -> str:
    return f"{start_hour}h–{end_hour}h"


def forecast_label(nxt: Record) -> str:
    if nxt.get("overdue"):
        return "a qualquer momento (prazo previsto já passou)"
    lo, hi = nxt["days_min"], nxt["days_max"]
    if lo == 0 and hi <= 1:
        return "nas próximas 24 h"
    if lo == 0:
        return f"em até {hi} dias"
    return f"em {lo} a {hi} dias"


def _with_label(nxt: Record | None) -> Record | None:
    return {**nxt, "label": forecast_label(nxt)} if nxt else None


def area_names(repo: Repository) -> dict[str, str]:
    return {a["id"]: a["name"] for a in repo.areas()}


def point_summary(point: Record, forecast: Record | None, names: dict[str, str]) -> Record:
    fc = forecast or {}
    return {
        "id": point["id"],
        "area_id": point["area_id"],
        "area_name": names.get(point["area_id"], point["area_id"]),
        "lat": point["lat"],
        "lon": point["lon"],
        "approximate": True,
        "waste_type": point["waste_type"],
        "risk": fc.get("risk", "baixo"),
        "chronic": fc.get("chronic", False),
        "episodes_last_15d": fc.get("episodes_last_15d", 0),
        "pending_cleaning": fc.get("pending_cleaning", False),
        "expected_within_7d": fc.get("expected_within_7d", False),
        "n_episodes": fc.get("n_episodes", 0),
        "last_episode": fc.get("last_episode"),
        "next": _with_label(fc.get("next")),
    }


def in_horizon(summary: Record, horizon: str) -> bool:
    """O ponto tem lixo no local (now) ou acúmulo previsto dentro do horizonte."""
    nxt = summary["next"]
    if horizon == "now":
        return summary["pending_cleaning"] or bool(nxt and nxt["overdue"])
    if summary["pending_cleaning"]:
        return True
    return bool(nxt) and (nxt["overdue"] or nxt["days_min"] <= HORIZON_DAYS[horizon])


def list_points(
    repo: Repository,
    *,
    waste_type: str | None = None,
    risk: str | None = None,
    area: str | None = None,
    horizon: str | None = None,
    chronic: bool | None = None,
    sort: str = "risk",
) -> list[Record]:
    names = area_names(repo)
    items = [point_summary(p, repo.point_forecast(p["id"]), names) for p in repo.points()]
    if waste_type:
        items = [i for i in items if i["waste_type"] == waste_type]
    if risk:
        wanted = "médio" if risk == "medio" else risk
        items = [i for i in items if i["risk"] == wanted]
    if area:
        items = [i for i in items if i["area_id"] == area]
    if chronic is not None:
        items = [i for i in items if i["chronic"] == chronic]
    if horizon:
        items = [i for i in items if in_horizon(i, horizon)]

    def next_days(i: Record) -> int:
        return i["next"]["days_expected"] if i["next"] else 10**6

    keys = {
        "risk": lambda i: (RISK_ORDER.get(i["risk"], 9), not i["chronic"], next_days(i), i["id"]),
        "next": lambda i: (next_days(i), i["id"]),
        "episodes": lambda i: (-i["episodes_last_15d"], -i["n_episodes"], i["id"]),
        "id": lambda i: i["id"],
    }
    return sorted(items, key=keys[sort])


def city_mean_interval(repo: Repository) -> float | None:
    values = [
        f["next"]["mean_interval_days"] for f in repo.point_forecasts() if f.get("next")
    ]
    return round(mean(values), 1) if values else None


def chronic_suggestions(pattern: Record | None) -> list[str]:
    patrol = (
        f"Fiscalização entre {pattern['start_hour']}h e {pattern['end_hour']}h (horário provável)"
        if pattern
        else "Fiscalização em horários variados até identificar o horário provável"
    )
    return [
        "Instalar placa informando o ponto de entrega mais próximo",
        "Ação porta a porta com os moradores e comércios do entorno",
        patrol,
        "Recuperação do espaço (plantio, iluminação, pintura)",
    ]


def linked_flood_area(repo: Repository, point: Record) -> Record | None:
    """Área de alagamento mais próxima que contém o ponto (com margem)."""
    best: Record | None = None
    for fa in repo.flood_areas():
        dist = haversine_m(point["lat"], point["lon"], fa["lat"], fa["lon"])
        if dist <= fa["radius_m"] + FLOOD_LINK_MARGIN_M and (
            best is None or dist < best["distance_m"]
        ):
            risk = ((repo.flood_forecast(fa["id"]) or {}).get("risk") or {}).get("72h")
            if risk:
                best = {
                    "id": fa["id"],
                    "name": fa["name"],
                    "distance_m": round(dist),
                    "score_72h": risk["score"],
                    "level_72h": risk["level"],
                }
    return best


def point_detail(
    repo: Repository, point: Record, *, episodes_limit: int = 50, cleanings_limit: int = 50
) -> Record:
    forecast = repo.point_forecast(point["id"]) or {}
    summary = point_summary(point, forecast, area_names(repo))
    episodes = sorted(repo.episodes_for_point(point["id"]), key=lambda e: e["start"], reverse=True)
    cleanings = sorted(
        repo.cleanings_for_point(point["id"]), key=lambda c: c["date"], reverse=True
    )

    raw_pattern = forecast.get("hour_pattern")
    pattern = None
    if raw_pattern:
        pattern = {
            **raw_pattern,
            "detected": raw_pattern.get("detected", raw_pattern["share"] >= 0.5),
            "label": hour_label(raw_pattern["start_hour"], raw_pattern["end_hour"]),
        }

    hours_30d, cleanings_30d = 0.0, 0
    as_of = repo.forecasts_as_of()
    if as_of:
        since = (datetime.fromisoformat(as_of) - timedelta(days=30)).isoformat(timespec="minutes")
        recent = [c for c in cleanings if c["date"] >= since]
        hours_30d = round(sum(c["team_hours"] for c in recent), 1)
        cleanings_30d = len(recent)

    chronic = summary["chronic"]
    in_window = summary["episodes_last_15d"]
    if chronic:
        message = (
            f"{in_window} episódios em {DEFAULT_WINDOW_DAYS} dias (limite: "
            f"{DEFAULT_MIN_EPISODES}). Limpeza sozinha não resolve: combine com ações no entorno."
        )
    else:
        message = (
            f"{in_window} episódio(s) em {DEFAULT_WINDOW_DAYS} dias. "
            f"Abaixo do limite de reincidência crônica ({DEFAULT_MIN_EPISODES})."
        )

    nxt = summary["next"]
    return {
        **summary,
        "hour_pattern": pattern,
        "recurrence": {
            "chronic": chronic,
            "episodes_in_window": in_window,
            "window_days": DEFAULT_WINDOW_DAYS,
            "min_episodes": DEFAULT_MIN_EPISODES,
            "message": message,
            "suggestions": chronic_suggestions(pattern if pattern and pattern["detected"] else None)
            if chronic
            else [],
        },
        "stats": {
            "mean_interval_days": nxt["mean_interval_days"] if nxt else None,
            "city_mean_interval_days": city_mean_interval(repo),
            "team_hours_last_30d": hours_30d,
            "cleanings_last_30d": cleanings_30d,
            "episodes_total": len(episodes),
        },
        "linked_flood_area": linked_flood_area(repo, point),
        "episodes": episodes[:episodes_limit],
        "cleanings": cleanings[:cleanings_limit],
        "cleanings_total": len(cleanings),
        "decisions": repo.decisions_for_point(point["id"]),
    }


def list_flood_areas(repo: Repository, horizon: str) -> list[Record]:
    items = []
    for fa in repo.flood_areas():
        forecast = repo.flood_forecast(fa["id"])
        if not forecast or horizon not in forecast.get("risk", {}):
            continue
        risk = forecast["risk"][horizon]
        items.append(
            {
                "id": fa["id"],
                "name": fa["name"],
                "area_id": fa["area_id"],
                "lat": fa["lat"],
                "lon": fa["lon"],
                "radius_m": fa["radius_m"],
                "approximate": True,
                "score": risk["score"],
                "level": risk["level"],
                "components": risk["components"],
                "factors": forecast["factors"],
                "risk_by_horizon": {
                    h: {"score": r["score"], "level": r["level"]}
                    for h, r in forecast["risk"].items()
                },
            }
        )
    return sorted(items, key=lambda i: (-i["score"], i["id"]))


# ----- fatos (números) usados nos textos gerados -----
Facts = dict[str, Any]


def point_facts(repo: Repository, point: Record) -> Facts:
    """Números do ponto para os textos. Sem dados pessoais (não há dados de cidadãos)."""
    detail = point_detail(repo, point, episodes_limit=0, cleanings_limit=0)
    nxt, pattern, flood = detail["next"], detail["hour_pattern"], detail["linked_flood_area"]
    return {
        "ponto": detail["id"],
        "bairro": detail["area_name"],
        "tipo_de_residuo": WASTE_LABELS.get(detail["waste_type"], detail["waste_type"]),
        "reincidente_cronico": detail["chronic"],
        "episodios_em_15_dias": detail["episodes_last_15d"],
        "episodios_no_historico": detail["stats"]["episodes_total"],
        "intervalo_medio_dias": detail["stats"]["mean_interval_days"],
        "intervalo_medio_cidade_dias": detail["stats"]["city_mean_interval_days"],
        "proximo_acumulo": nxt["label"] if nxt else None,
        "confianca_da_previsao": nxt["confidence"] if nxt else None,
        "horario_provavel": pattern["label"] if pattern and pattern["detected"] else None,
        "horas_de_equipe_30_dias": detail["stats"]["team_hours_last_30d"],
        "limpezas_30_dias": detail["stats"]["cleanings_last_30d"],
        "area_de_alagamento_proxima": flood["name"] if flood else None,
        "risco_de_alagamento_72h": flood["score_72h"] if flood else None,
    }


def map_facts(repo: Repository) -> Facts:
    kmap = repo.kpis().get("map", {})
    areas = list_flood_areas(repo, "72h")
    top = areas[0] if areas else None
    rain = repo.rain().get("horizons", {}).get("72h", {})
    return {
        "areas_risco_alto_72h": kmap.get("high_risk_areas_72h", 0),
        "pontos_com_entulho_previsto_7_dias": kmap.get("debris_points_next_7d", 0),
        "reincidentes_cronicos": kmap.get("chronic_points", 0),
        "bocas_de_lobo_limpas_antes_da_chuva_pct": kmap.get("drains_cleaned_before_rain_pct"),
        "area_mais_critica": top["name"] if top else None,
        "risco_da_area_mais_critica": top["score"] if top else None,
        "chuva_prevista_24h_mm": rain.get("rain_24h_mm"),
    }


def forecasts_facts(repo: Repository) -> Facts:
    impact = repo.kpis().get("impact", {})
    totals = repo.next3months().get("totals", {})
    rec, floods = totals.get("recurrences", {}), totals.get("flood_events", {})
    return {
        "reincidencia_proximos_3_meses_pct": impact.get("recurrence", {}).get(
            "next_3_months_change_pct"
        ),
        "retornos_sem_acao": rec.get("without_action"),
        "retornos_com_plano": rec.get("with_plan"),
        "alagamentos_sem_acao": floods.get("without_action"),
        "alagamentos_com_plano": floods.get("with_plan"),
        "dias_limpo_antes": impact.get("days_clean", {}).get("before"),
        "dias_limpo_depois": impact.get("days_clean", {}).get("after"),
        "acerto_alagamentos_pct": impact.get("flood_accuracy", {}).get("pct"),
        "bocas_de_lobo_antes_pct": impact.get("drains_before_rain", {}).get("before_pct"),
        "bocas_de_lobo_depois_pct": impact.get("drains_before_rain", {}).get("after_pct"),
        "horas_economizadas_por_trimestre": impact.get("team_hours_saved", {}).get("per_quarter"),
    }


def flood_area_facts(repo: Repository, flood_area: Record) -> Facts:
    forecast = repo.flood_forecast(flood_area["id"]) or {}
    risk, factors = forecast.get("risk", {}), forecast.get("factors", {})
    rain = repo.rain().get("horizons", {}).get("72h", {})
    return {
        "area": flood_area["name"],
        "risco_agora": risk.get("now", {}).get("score"),
        "risco_24h": risk.get("24h", {}).get("score"),
        "risco_72h": risk.get("72h", {}).get("score"),
        "nivel_72h": risk.get("72h", {}).get("level"),
        "risco_3_meses": risk.get("3m", {}).get("score"),
        "chuva_prevista_24h_mm": rain.get("rain_24h_mm"),
        "bocas_de_lobo_entupidas": factors.get("clogged_drains"),
        "bocas_de_lobo_total": factors.get("total_drains"),
        "pontos_de_lixo_proximos": factors.get("waste_points_nearby"),
        "alagamentos_por_ano": factors.get("events_per_year"),
    }
