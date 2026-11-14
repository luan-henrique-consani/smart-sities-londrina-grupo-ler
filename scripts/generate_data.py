"""Gera os dados SIMULADOS da Londrina Limpa em /data.

Uso:
    python scripts/generate_data.py

- Seed fixo: o resultado é reproduzível (só `meta.generated_at` muda).
- As regras de negócio vêm de backend/services (as mesmas que a API usa).
- numpy é usado só aqui (sorteios); a função serverless não depende dele.
- data/users.json só é (re)criado se não existir ou se as senhas forem
  informadas em DEMO_PASSWORDS ("admin=...,gestor=...,tecnico=...,defesa_civil=...").
  As senhas nunca ficam no código.
"""

from __future__ import annotations

import json
import os
import secrets
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from math import cos, pi, radians, sin, sqrt
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend import __version__  # noqa: E402
from backend.services import kpis as kpi  # noqa: E402
from backend.services.episodes import Report, group_reports, nearest_point  # noqa: E402
from backend.services.flood_risk import flood_risk_score  # noqa: E402
from backend.services.forecast import hour_pattern, predict_next_accumulation  # noqa: E402
from backend.services.geo import haversine_m  # noqa: E402
from backend.services.projection import (  # noqa: E402
    PLAN_FLOOD_EFFECT,
    PLAN_RECURRENCE_EFFECT,
    apply_plan,
    monthly_baseline,
)
from backend.services.recurrence import (  # noqa: E402
    DEFAULT_MIN_EPISODES,
    DEFAULT_WINDOW_DAYS,
    count_recurrences,
    episodes_in_window,
    is_chronic,
    was_ever_chronic,
)
from backend.services.seasonality import debris_factor, events_between  # noqa: E402

DATA_DIR = ROOT / "data"
SEED = 20261114
REF = datetime(2026, 11, 14, 6, 0)  # data de referência ("agora" dos dados)
HIST_START = datetime(2022, 1, 1)
SYSTEM_START = datetime(2026, 7, 1)  # início das previsões
FORECAST_END = date(2027, 2, 28)
BASELINE_SEASONS = (2022, 2023, 2024, 2025)  # dez do ano N + jan/fev do ano N+1
MIN_POINT_SEPARATION_M = 300.0
MIN_INTERVAL_DAYS = 2.9  # garante que dois despejos nunca se fundem (48 h)
TARGET_HOURS_SAVED = 1240  # referência do protótipo (calibra a média de horas)
TZ = timezone(timedelta(hours=-3))  # horário de Brasília (fixo desde 2019)

rng = np.random.default_rng(SEED)

# id, nome, lat, lon, raio base (m), nº de pontos, nº de pontos "quentes", nº de crônicos
AREAS = [
    ("igapo", "Lago Igapó", -23.3270, -51.1720, 1300, 26, 6, 3),
    ("quebec", "Jardim Quebec", -23.3100, -51.1800, 900, 16, 4, 2),
    ("centro", "Centro", -23.3139, -51.1621, 1200, 26, 5, 2),
    ("cambe", "Fundo de vale do Ribeirão Cambé", -23.3180, -51.1980, 1200, 18, 3, 1),
    ("bandeirantes", "Jardim Bandeirantes", -23.3018, -51.2054, 1000, 16, 2, 0),
    ("vila_nova", "Vila Nova", -23.2971, -51.1669, 900, 15, 2, 1),
    ("cinco_conjuntos", "Cinco Conjuntos", -23.2607, -51.1438, 1500, 26, 4, 1),
    ("palhano", "Gleba Palhano", -23.3340, -51.1880, 1200, 16, 1, 0),
    ("zona_norte", "Zona Norte", -23.2700, -51.1700, 1700, 30, 4, 1),
    ("leonor", "Jardim Leonor", -23.2940, -51.2010, 900, 13, 1, 0),
    ("casoni", "Vila Casoni", -23.3024, -51.1503, 900, 14, 2, 1),
    ("shangrila", "Jardim Shangri-lá", -23.2976, -51.1835, 900, 13, 1, 0),
    ("vila_brasil", "Vila Brasil", -23.3275, -51.1504, 900, 14, 2, 0),
    ("aeroporto", "Aeroporto", -23.3311, -51.1307, 1100, 14, 1, 0),
    ("ouro_branco", "Parque Ouro Branco", -23.3616, -51.1450, 1100, 16, 2, 0),
    ("uniao_vitoria", "Jardim União da Vitória", -23.3897, -51.1173, 1100, 15, 1, 0),
    ("california", "Jardim Califórnia", -23.3469, -51.1166, 1000, 12, 1, 0),
]

# nome, lat, lon, raio (m), suscetibilidade (0–1), bocas de lobo entupidas (de 6)
FLOOD_AREAS = [
    ("Lago Igapó — barragem e marginal", -23.3275, -51.1700, 600, 1.00, 4),
    ("Jardim Quebec — baixada", -23.3105, -51.1810, 400, 0.80, 3),
    ("Centro — Av. Leste-Oeste e Terminal", -23.3084, -51.1609, 450, 0.72, 3),
    ("Fundo de vale do Ribeirão Cambé", -23.3180, -51.1980, 500, 0.60, 2),
    ("Córrego Capivara", -23.3378, -51.1616, 400, 0.50, 2),
    ("Av. Dez de Dezembro — trecho sul", -23.3554, -51.1495, 400, 0.45, 1),
    ("Ribeirão Lindóia", -23.2730, -51.1644, 450, 0.50, 2),
    ("Ribeirão Quati", -23.2906, -51.1495, 400, 0.45, 1),
    ("Cinco Conjuntos — Av. Saul Elkind", -23.2620, -51.1460, 400, 0.40, 1),
    ("Gleba Palhano — Av. Madre Leônia", -23.3330, -51.1860, 400, 0.40, 1),
    ("Jardim Bandeirantes", -23.3030, -51.2040, 350, 0.35, 1),
    ("Jardim Leonor", -23.2945, -51.2000, 350, 0.35, 1),
    ("Vila Casoni", -23.3024, -51.1503, 350, 0.40, 1),
    ("Vila Nova — baixada", -23.2975, -51.1675, 350, 0.38, 1),
    ("Jardim Shangri-lá", -23.2976, -51.1835, 350, 0.30, 1),
    ("Vila Brasil — Av. Duque de Caxias", -23.3235, -51.1551, 350, 0.42, 1),
    ("Aeroporto", -23.3311, -51.1307, 350, 0.25, 1),
    ("Jardim Califórnia", -23.3469, -51.1166, 350, 0.25, 1),
]
DRAINS_PER_AREA = 6

WASTE_TYPES = ["entulho", "volumosos", "poda", "domestico", "pneus", "misto"]
WASTE_PROBS = [0.40, 0.20, 0.15, 0.12, 0.05, 0.08]
BURST_PROB = {"carnaval": 0.25, "fim_de_ano": 0.35}  # chance de despejo extra por ponto
NIGHT_HOURS = [19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5]

# mês → (chuva média mensal em mm, probabilidade de dia chuvoso) — clima aproximado
RAIN_CLIMATE = {
    1: (250, 0.55), 2: (210, 0.50), 3: (160, 0.42), 4: (100, 0.28),
    5: (100, 0.25), 6: (85, 0.22), 7: (60, 0.16), 8: (50, 0.14),
    9: (90, 0.25), 10: (120, 0.32), 11: (125, 0.33), 12: (225, 0.52),
}  # fmt: skip

USERS = [
    ("U-01", "admin", "Administrador Demo", "admin@londrinalimpa.example", "Administrador"),
    ("U-02", "gestor", "Gestora Demo", "gestor@londrinalimpa.example", "Gestor — CMTU/CTD"),
    ("U-03", "tecnico", "Técnico Demo", "tecnico@londrinalimpa.example", "Técnico de campo"),
    ("U-04", "defesa_civil", "Agente Demo", "defesa@londrinalimpa.example", "Defesa Civil"),
]


# ---------------------------------------------------------------- utilitários


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M")


def offset(lat: float, lon: float, dist_m: float, angle: float) -> tuple[float, float]:
    dlat = dist_m * cos(angle) / 111_320
    dlon = dist_m * sin(angle) / (111_320 * cos(radians(lat)))
    return round(lat + dlat, 6), round(lon + dlon, 6)


def random_in_disk(lat: float, lon: float, radius_m: float) -> tuple[float, float]:
    return offset(lat, lon, radius_m * sqrt(rng.random()), rng.random() * 2 * pi)


def gamma(mean: float, shape: float) -> float:
    return float(rng.gamma(shape, mean / shape))


def write_json(name: str, payload: object, compact: bool = False) -> None:
    kwargs = {"separators": (",", ":")} if compact else {"indent": 2}
    text = json.dumps(payload, ensure_ascii=False, **kwargs)
    (DATA_DIR / name).write_text(text + "\n", encoding="utf-8", newline="\n")


def month_bounds(year: int, month: int) -> tuple[datetime, datetime]:
    start = datetime(year, month, 1)
    end = datetime(year + (month == 12), month % 12 + 1, 1)
    return start, end


# ------------------------------------------------------------ áreas e pontos


def build_areas_and_points() -> tuple[list[dict], list[dict]]:
    areas, points = [], []
    placed: list[tuple[float, float]] = []

    def place(lat: float, lon: float, radius: float) -> tuple[float, float]:
        for attempt in range(6000):
            if attempt and attempt % 1000 == 0:
                radius *= 1.1
            cand = random_in_disk(lat, lon, radius)
            if all(haversine_m(*cand, *p) >= MIN_POINT_SEPARATION_M for p in placed):
                placed.append(cand)
                return cand
        raise RuntimeError("não foi possível posicionar os pontos")

    for aid, name, lat, lon, base_radius, n_points, n_hot, n_chronic in AREAS:
        radius = max(base_radius, 1000 * sqrt(n_points * 0.085 / pi / 0.28))
        areas.append(
            {
                "id": aid,
                "name": name,
                "lat": lat,
                "lon": lon,
                "radius_m": round(radius),
                "approximate": True,
            }
        )
        for i in range(n_points):
            hot = i < n_hot
            plat, plon = place(lat, lon, radius * (0.55 if hot else 1.0))
            points.append(
                {
                    "area_id": aid,
                    "lat": plat,
                    "lon": plon,
                    "waste_type": str(rng.choice(WASTE_TYPES, p=WASTE_PROBS)),
                    "hot": hot,
                    "chronic": i < n_chronic,
                }
            )
    order = rng.permutation(len(points))
    points = [points[i] for i in order]
    for n, point in enumerate(points, start=1):
        point["id"] = f"D-{n:04d}"
    return areas, points


# ------------------------------------------------- despejos, relatos, episódios


def seasonal_burst(after: datetime, before: datetime) -> datetime | None:
    """Despejo extra em pontos comuns durante o Carnaval e as festas de fim de ano."""
    earliest = (after + timedelta(days=4)).date()
    for event in events_between(earliest, before.date()):
        chance = BURST_PROB.get(event.key)
        if chance and event.start >= earliest and rng.random() < chance:
            span = (event.end - event.start).days
            day = event.start + timedelta(days=int(rng.integers(0, span + 1)))
            return datetime.combine(day, datetime.min.time())
    return None


def simulate_incidents(points: list[dict]) -> list[dict]:
    """Simula os despejos de cada ponto e os relatos que cada um gera."""
    incidents = []
    for p in points:
        hot, chronic = p["hot"], p["chronic"]
        relapse = REF - timedelta(days=float(rng.uniform(17, 24))) if chronic else None
        if hot:
            base_gap = float(rng.uniform(5.2, 6.8))
            peak = int(rng.choice(NIGHT_HOURS))
        else:
            base_gap = float(np.clip(rng.lognormal(np.log(170), 0.5), 60, 420))
            peak = int(rng.integers(7, 22))

        def at_time(day: datetime, focused: bool, hot=hot, peak=peak) -> datetime:
            if hot and (focused or rng.random() < 0.78):
                hour = (peak + float(rng.uniform(-1.5, 1.5))) % 24
            elif hot:
                hour = float(rng.uniform(0, 24))
            else:
                hour = float(np.clip(rng.normal(peak, 3), 5, 23.5))
            return day.replace(hour=int(hour), minute=int(hour % 1 * 60), second=0, microsecond=0)

        first = HIST_START + timedelta(days=float(rng.uniform(0, base_gap + (4 if hot else 60))))
        t = at_time(first, False)
        while t <= REF:
            post = t >= SYSTEM_START
            in_relapse = relapse is not None and t >= relapse
            factor = debris_factor(t)
            if in_relapse:
                wait = float(rng.uniform(0.5, 1.0))
                interval = float(rng.choice([3, 4], p=[0.6, 0.4]))
            else:
                if post:
                    wait = float(np.clip(gamma(1.5, 3), 0.3, 4))
                else:
                    wait = float(np.clip(gamma(4.0 if hot else 5.0, 3), 0.5, 12))
                if hot and post:
                    gap = max(8.5, gamma(G_POST, 4) / factor)
                elif hot:
                    gap = gamma(base_gap, 3) / factor**2
                else:
                    gap = gamma(base_gap * (1.3 if post else 1.0), 4) / factor
                interval = wait + gap

            nxt = at_time(t + timedelta(days=interval), in_relapse)
            if not hot:
                burst = seasonal_burst(t, nxt)
                if burst is not None:
                    nxt = at_time(burst, False)
            if relapse is not None and t < relapse <= nxt:
                nxt = at_time(max(relapse, t + timedelta(days=3)), True)
            while (nxt - t).total_seconds() / 86400 < MIN_INTERVAL_DAYS:
                nxt += timedelta(days=1)

            cleaned = min(t + timedelta(days=wait), nxt - timedelta(hours=2))
            cleaned = cleaned.replace(second=0, microsecond=0)

            n_reports = min(8, 1 + int(rng.poisson(2.0 if hot else 0.7)))
            delays = sorted(float(x) for x in rng.uniform(0.2, 20, n_reports - 1))
            whens = [t] + [
                (t + timedelta(hours=h)).replace(second=0, microsecond=0) for h in delays
            ]
            reports = []
            for when in whens:
                dx, dy = (float(np.clip(rng.normal(0, 18), -40, 40)) for _ in range(2))
                rlat = p["lat"] + dy / 111_320
                rlon = p["lon"] + dx / (111_320 * cos(radians(p["lat"])))
                reports.append(Report(lat=rlat, lon=rlon, when=when))

            volume = float(rng.lognormal(np.log(1.6), 0.5)) * (1.3 if factor >= 1.4 else 1.0)
            incidents.append(
                {
                    "point_id": p["id"],
                    "start": t,
                    "cleaned": cleaned if cleaned <= REF else None,
                    "volume_m3": round(volume * (1.4 if hot else 1.0), 1),
                    "reports": [r for r in reports if r.when <= REF],
                }
            )
            t = nxt
    return incidents


def build_episodes(points: list[dict], incidents: list[dict]) -> list[dict]:
    """Agrupa TODOS os relatos pela regra de 150 m / 48 h (serviço real)."""
    all_reports = [r for inc in incidents for r in inc["reports"]]
    grouped = group_reports(all_reports)
    by_key = {(inc["point_id"], inc["start"]): inc for inc in incidents}
    registry = [(p["id"], p["lat"], p["lon"]) for p in points]

    episodes = []
    for n, ep in enumerate(grouped, start=1):
        point_id = nearest_point(ep.lat, ep.lon, registry)
        incident = by_key.get((point_id, ep.start))
        if incident is None or ep.n_reports != len(incident["reports"]):
            raise RuntimeError("o agrupamento não reproduziu os despejos simulados")
        episodes.append(
            {
                "id": f"E-{n:05d}",
                "point_id": point_id,
                "start": ep.start,
                "end": ep.end,
                "reports": ep.n_reports,
                "volume_m3": incident["volume_m3"],
                "cleaned": incident["cleaned"],
            }
        )
    if len(episodes) != len(incidents):
        raise RuntimeError("número de episódios diferente do número de despejos")
    return episodes


# ------------------------------------------------------------------- chuva


def simulate_rain(start: date, end: date, gen: np.random.Generator) -> list[tuple[date, float]]:
    out, day = [], start
    while day <= end:
        total, p_wet = RAIN_CLIMATE[day.month]
        mm = 0.0
        if gen.random() < p_wet:
            mean = total / (30.4 * p_wet)
            mm = round(min(115.0, float(gen.gamma(0.5, mean / 0.5))), 1)
        out.append((day, mm))
        day += timedelta(days=1)
    return out


def simulate_weather(seed: int) -> tuple[list, list, list[dict]]:
    """Chuva observada, chuva prevista e alagamentos para um seed de clima."""
    gen = np.random.default_rng(seed)
    observed = simulate_rain(HIST_START.date(), REF.date() - timedelta(days=1), gen)
    forecast = simulate_rain(REF.date(), FORECAST_END, gen)
    events = []
    for day, mm in observed:
        if mm < kpi.HEAVY_RAIN_MM:
            continue
        post = day >= SYSTEM_START.date()
        intensity = min(1.0, (mm - 20) / 50)
        for index, area in enumerate(FLOOD_AREAS):
            p_flood = min(0.95, area[4] * intensity * 1.1 * (POST_FLOOD_FACTOR if post else 1.0))
            if gen.random() < p_flood:
                roll = gen.random() + (mm - 30) / 120
                severity = "grave" if roll > 1.0 else "moderado" if roll > 0.55 else "leve"
                events.append(
                    {
                        "flood_area_id": f"A-{index + 1:02d}",
                        "date": day,
                        "rain_mm": mm,
                        "severity": severity,
                        "predicted": None,
                    }
                )
    return observed, forecast, events


def hit_ok(n: int) -> bool:
    """O nº de alagamentos pós-sistema permite um acerto de exatamente 78%?"""
    return n >= 9 and round(100 * round(0.78 * n) / n) == 78


def scenario_ok(observed: list, events: list[dict]) -> bool:
    """O cenário de clima conta a história pedida para a demonstração?

    A chuva é aleatória e pode esconder o efeito do sistema; por isso o gerador
    procura um seed de clima em que a melhora a partir de jul/2026 fica visível
    também nos números brutos de alagamentos.
    """
    years = range(2022, 2027)
    ref = (REF.month, REF.day)
    full = {y: sum(1 for e in events if e["date"].year == y) for y in years}

    def in_h2(day: date) -> bool:
        return day.month >= 7 and (day.month, day.day) < ref

    h2 = {y: sum(1 for e in events if e["date"].year == y and in_h2(e["date"])) for y in years}
    heavy = {
        y: sum(1 for d, mm in observed if d.year == y and in_h2(d) and mm >= kpi.HEAVY_RAIN_MM)
        for y in years
    }
    summer = sum(1 for e in events if e["date"].month in (12, 1, 2, 3))
    return (
        summer >= 0.55 * len(events)
        and hit_ok(h2[2026])
        and full[2026] < min(full[y] for y in years if y != 2026)
        and h2[2026] < min(h2[y] for y in years if y != 2026)
        and heavy[2026] >= 4
        and min(heavy.values()) >= 3
    )


def pick_weather() -> tuple[int, list, list, list[dict]]:
    for seed in range(SEED, SEED + 20000):
        observed, forecast, events = simulate_weather(seed)
        if scenario_ok(observed, events):
            return seed, observed, forecast, events
    raise RuntimeError("nenhum cenário de clima atende à narrativa; ajuste os parâmetros")


# --------------------------------------------------------------- principal


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    DATA_DIR.mkdir(exist_ok=True)
    areas, points = build_areas_and_points()
    area_name = {a["id"]: a["name"] for a in areas}
    point_by_id = {p["id"]: p for p in points}

    incidents = simulate_incidents(points)
    episodes = build_episodes(points, incidents)

    starts_by_point: dict[str, list[datetime]] = defaultdict(list)
    for e in episodes:
        starts_by_point[e["point_id"]].append(e["start"])
    all_ids = [p["id"] for p in points]

    def recurrences(start: datetime, end: datetime) -> int:
        return sum(count_recurrences(starts_by_point[i], start, end) for i in all_ids)

    def episode_count(start: datetime, end: datetime) -> int:
        return sum(1 for e in episodes if start <= e["start"] < end)

    # ---- projeção de reincidência (define a calibração das horas de equipe)
    forecast_months = [(2026, 12), (2027, 1), (2027, 2)]
    rec_counts, ep_counts = {}, {}
    for season in BASELINE_SEASONS:
        for year, month in ((season, 12), (season + 1, 1), (season + 1, 2)):
            ms, me = month_bounds(year, month)
            rec_counts[(year, month)] = recurrences(ms, me)
            ep_counts[(year, month)] = episode_count(ms, me)

    def baseline_years(month: int) -> list[int]:
        return [s if month == 12 else s + 1 for s in BASELINE_SEASONS]

    rec_without = [
        round(monthly_baseline(rec_counts, m, baseline_years(m))) for _, m in forecast_months
    ]
    rec_with = [apply_plan(v, PLAN_RECURRENCE_EFFECT) for v in rec_without]
    avoided = sum(rec_without) - sum(rec_with)
    target_hours = TARGET_HOURS_SAVED / avoided

    # ---- limpezas e vistorias
    cleanings = []
    cleanings_by_point: dict[str, list[datetime]] = defaultdict(list)
    clean_pairs = []
    for e in episodes:
        if e["cleaned"] is None:
            continue
        hours = max(1.0, round(target_hours * gamma(1.0, 9), 1))
        cleanings.append(
            {
                "kind": "limpeza",
                "point_id": e["point_id"],
                "episode_id": e["id"],
                "date": e["cleaned"],
                "team_hours": hours,
            }
        )
        cleanings_by_point[e["point_id"]].append(e["cleaned"])
        clean_pairs.append((e["start"], e["cleaned"]))
    for p in points:
        if not p["hot"]:
            continue
        day = SYSTEM_START + timedelta(days=float(rng.uniform(2, 25)))
        while day < REF:
            visit = day.replace(hour=int(rng.integers(8, 17)), minute=0, second=0, microsecond=0)
            cleanings.append(
                {
                    "kind": "vistoria",
                    "point_id": p["id"],
                    "date": visit,
                    "team_hours": round(float(rng.uniform(0.5, 1.5)), 1),
                }
            )
            step = rng.uniform(9, 16) if p["chronic"] else rng.uniform(25, 40)
            day += timedelta(days=float(step))
    limpeza_hours = [c["team_hours"] for c in cleanings if c["kind"] == "limpeza"]
    avg_team_hours = round(sum(limpeza_hours) / len(limpeza_hours), 2)

    # ---- chuva e alagamentos (cenário de clima escolhido por pick_weather)
    weather_seed, observed, forecast_rain, flood_events = pick_weather()
    heavy_days = [d for d, mm in observed if mm >= kpi.HEAVY_RAIN_MM]

    # ---- áreas de alagamento, bocas de lobo, eventos
    flood_areas, drains = [], []
    for n, (name, lat, lon, radius, susceptibility, n_clogged) in enumerate(FLOOD_AREAS, 1):
        nearest = min(areas, key=lambda a: haversine_m(lat, lon, a["lat"], a["lon"]))
        fa = {
            "id": f"A-{n:02d}",
            "name": name,
            "area_id": nearest["id"],
            "lat": lat,
            "lon": lon,
            "radius_m": radius,
            "approximate": True,
            "_s": susceptibility,
            "_clogged": n_clogged,
        }
        flood_areas.append(fa)
        for _ in range(DRAINS_PER_AREA):
            dlat, dlon = random_in_disk(lat, lon, radius)
            drains.append(
                {"id": f"B-{len(drains) + 1:03d}", "flood_area_id": fa["id"], "lat": dlat,
                 "lon": dlon}
            )  # fmt: skip
    fa_by_id = {fa["id"]: fa for fa in flood_areas}

    # Alagamentos desde o início das previsões: marca os que tiveram alerta prévio.
    post_events = [e for e in flood_events if e["date"] >= SYSTEM_START.date()]
    ranked = sorted(
        post_events, key=lambda e: (fa_by_id[e["flood_area_id"]]["_s"], e["rain_mm"]), reverse=True
    )
    n_hits = round(0.78 * len(post_events))
    for i, e in enumerate(ranked):
        e["predicted"] = i < n_hits
    for n, e in enumerate(flood_events, start=1):
        e["id"] = f"F-{n:04d}"

    # ---- limpeza de bocas de lobo antes de chuva forte
    drain_ids = [d["id"] for d in drains]
    drain_cleanings: dict[str, list[date]] = defaultdict(list)
    pre_rates = {2022: 0.39, 2023: 0.43, 2024: 0.38, 2025: 0.41, 2026: 0.42}
    previous_heavy: date | None = None
    for day in heavy_days:
        post = datetime.combine(day, datetime.min.time()) >= SYSTEM_START
        quota = round((0.82 if post else pre_rates[day.year]) * len(drain_ids))
        covered = {
            d for d in drain_ids
            if any(0 < (day - c).days <= kpi.DRAIN_LEAD_DAYS for c in drain_cleanings[d])
        }  # fmt: skip
        pending = [d for d in drain_ids if d not in covered]
        need = max(0, quota - len(covered))
        if need:
            weights = np.array(
                [0.5 + fa_by_id[d_["flood_area_id"]]["_s"] if post else 1.0
                 for d_ in drains if d_["id"] in set(pending)]
            )  # fmt: skip
            chosen = rng.choice(pending, size=min(need, len(pending)), replace=False,
                                p=weights / weights.sum())  # fmt: skip
            earliest = day - timedelta(days=5)
            if previous_heavy is not None:
                earliest = max(earliest, previous_heavy)
            span = (day - timedelta(days=1) - earliest).days
            for drain_id in chosen:
                when = earliest + timedelta(days=int(rng.integers(0, span + 1)))
                drain_cleanings[str(drain_id)].append(when)
                cleanings.append(
                    {
                        "kind": "boca_de_lobo",
                        "drain_id": str(drain_id),
                        "date": datetime.combine(when, datetime.min.time()).replace(
                            hour=int(rng.integers(8, 17))
                        ),
                        "team_hours": round(float(rng.uniform(1.0, 2.5)), 1),
                    }
                )
        previous_heavy = day

    for fa in flood_areas:
        own = [d for d in drains if d["flood_area_id"] == fa["id"]]
        own.sort(key=lambda d: max(drain_cleanings[d["id"]], default=date.min))
        for i, d in enumerate(own):
            last = max(drain_cleanings[d["id"]], default=None)
            d["status"] = (
                "entupida" if i < fa["_clogged"] else "parcial" if i < fa["_clogged"] + 2
                else "limpa"
            )  # fmt: skip
            d["last_cleaned"] = last.isoformat() if last else None
    drains.sort(key=lambda d: d["id"])

    # ---- previsões por ponto
    pending_ids = {
        e["point_id"] for e in episodes
        if e["cleaned"] is None and e["start"] == starts_by_point[e["point_id"]][-1]
    }  # fmt: skip
    point_forecasts = []
    chronic_ids = []
    for p in points:
        starts = starts_by_point[p["id"]]
        chronic = is_chronic(starts, REF)
        if chronic:
            chronic_ids.append(p["id"])
        fc = predict_next_accumulation(starts, REF, debris_factor)
        nxt = None
        if fc is not None:
            nxt = {
                "days_min": fc.days_min,
                "days_max": fc.days_max,
                "days_expected": fc.days_expected,
                "date_min": fc.date_min.isoformat(),
                "date_max": fc.date_max.isoformat(),
                "mean_interval_days": fc.mean_interval_days,
                "seasonal_factor": fc.seasonal_factor,
                "confidence": fc.confidence,
                "overdue": fc.overdue,
            }
        # "previsto em 7 dias": data mais provável entre 3 dias atrás e 7 dias à frente
        soon = fc is not None and fc.confidence != "baixa" and -3 <= fc.days_expected <= 7
        if chronic or (soon and fc.days_max <= 3 and fc.mean_interval_days <= 15):
            risk = "alto"
        elif soon or p["id"] in pending_ids:
            risk = "médio"
        else:
            risk = "baixo"
        pattern = hour_pattern(starts[-40:])
        point_forecasts.append(
            {
                "point_id": p["id"],
                "n_episodes": len(starts),
                "last_episode": iso(starts[-1]) if starts else None,
                "episodes_last_15d": episodes_in_window(starts, REF),
                "chronic": chronic,
                "pending_cleaning": p["id"] in pending_ids,
                "risk": risk,
                "expected_within_7d": soon,
                "next": nxt,
                "hour_pattern": (
                    {"start_hour": pattern.start_hour, "end_hour": pattern.end_hour,
                     "share": pattern.share}
                    if pattern and pattern.detected else None
                ),  # fmt: skip
            }
        )
    fc_by_point = {f["point_id"]: f for f in point_forecasts}
    if set(chronic_ids) != {p["id"] for p in points if p["chronic"]}:
        raise RuntimeError(f"reincidentes crônicos fora do esperado: {len(chronic_ids)}")

    # ---- risco de alagamento por horizonte
    years_observed = (REF - HIST_START).days / 365.25
    for fa in flood_areas:
        own = [d for d in drains if d["flood_area_id"] == fa["id"]]
        fa["_events_per_year"] = round(
            sum(1 for e in flood_events if e["flood_area_id"] == fa["id"]) / years_observed, 1
        )
        fa["_clogged_now"] = sum(1 for d in own if d["status"] == "entupida")
        fa["_total_drains"] = len(own)
        fa["_waste"] = sum(
            1 for p in points
            if (p["id"] in chronic_ids or p["id"] in pending_ids)
            and haversine_m(fa["lat"], fa["lon"], p["lat"], p["lon"]) <= fa["radius_m"] + 400
        )  # fmt: skip

    def risk_for(fa: dict, rain_3h: float, rain_24h: float):
        return flood_risk_score(rain_3h, rain_24h, fa["_events_per_year"], fa["_clogged_now"],
                                fa["_total_drains"], fa["_waste"])  # fmt: skip

    storm_24h = None
    for candidate in range(35, 121):
        levels = [risk_for(fa, round(candidate * 0.56), candidate).level for fa in flood_areas]
        if levels.count("alto") == 3 and levels[0] == "alto":
            storm_24h = float(candidate)
            break
    if storm_24h is None:
        raise RuntimeError("não foi possível calibrar a chuva de 72 h para 3 áreas em risco alto")

    forecast_rain[0] = (forecast_rain[0][0], 18.0)
    forecast_rain[1] = (forecast_rain[1][0], storm_24h)
    forecast_rain[2] = (forecast_rain[2][0], 24.0)
    worst = max(mm for _, mm in forecast_rain)
    horizons = {
        "now": {"rain_3h_mm": 0.0, "rain_24h_mm": 0.0},
        "24h": {"rain_3h_mm": 10.0, "rain_24h_mm": 18.0},
        "72h": {"rain_3h_mm": float(round(storm_24h * 0.56)), "rain_24h_mm": storm_24h},
        "3m": {"rain_3h_mm": round(worst * 0.55, 1), "rain_24h_mm": worst},
    }
    area_forecasts = []
    for fa in flood_areas:
        risk = {}
        for key, rain in horizons.items():
            r = risk_for(fa, rain["rain_3h_mm"], rain["rain_24h_mm"])
            risk[key] = {"score": r.score, "level": r.level,
                         "components": {"rain": r.rain, "history": r.history,
                                        "drains": r.drains, "waste": r.waste}}  # fmt: skip
        area_forecasts.append(
            {
                "flood_area_id": fa["id"],
                "factors": {
                    "events_per_year": fa["_events_per_year"],
                    "clogged_drains": fa["_clogged_now"],
                    "total_drains": fa["_total_drains"],
                    "waste_points_nearby": fa["_waste"],
                },
                "risk": risk,
            }
        )
    high_72h = [f for f in area_forecasts if f["risk"]["72h"]["level"] == "alto"]

    # ---- KPIs
    def window(year: int) -> tuple[datetime, datetime]:
        return datetime(year, 7, 1), datetime(year, REF.month, REF.day)

    before, after = window(2025), window(2026)
    recidivists = [i for i in all_ids if was_ever_chronic(starts_by_point[i])]
    rec_cleanings = {i: cleanings_by_point[i] for i in recidivists}

    def drains_pct(start: datetime, end: datetime) -> float | None:
        days = [d for d in heavy_days if start.date() <= d < end.date()]
        return kpi.drains_cleaned_before_rain(days, drain_cleanings, drain_ids)

    hit = kpi.flood_hit_rate(e["predicted"] for e in post_events)
    rec_before, rec_after = recurrences(*before), recurrences(*after)
    hours_saved = kpi.team_hours_saved(avoided, avg_team_hours)
    kpis_payload = {
        "as_of": iso(REF),
        "system_start": SYSTEM_START.date().isoformat(),
        "periods": {
            "before": {"start": before[0].date().isoformat(), "end": before[1].date().isoformat(),
                       "label": "jul–nov/2025 (antes das previsões)"},
            "after": {"start": after[0].date().isoformat(), "end": after[1].date().isoformat(),
                      "label": "jul–nov/2026 (com as previsões)"},
        },  # fmt: skip
        "map": {
            "high_risk_areas_72h": len(high_72h),
            "debris_points_next_7d": sum(1 for f in point_forecasts if f["expected_within_7d"]),
            "chronic_points": len(chronic_ids),
            "drains_cleaned_before_rain_pct": round(drains_pct(*after)),
        },
        "impact": {
            "recurrence": {
                "before": rec_before,
                "after": rec_after,
                "change_pct": kpi.pct_change(rec_before, rec_after),
                "next_3_months_change_pct": round(
                    kpi.pct_change(sum(rec_without), sum(rec_with))
                ),
            },
            "days_clean": {
                "before": kpi.mean_days_clean(rec_cleanings, starts_by_point, *before),
                "after": kpi.mean_days_clean(rec_cleanings, starts_by_point, *after),
                "points_considered": len(recidivists),
            },
            "days_to_clean": {
                "before": kpi.mean_days_to_clean(clean_pairs, *before),
                "after": kpi.mean_days_to_clean(clean_pairs, *after),
            },
            "flood_accuracy": hit,
            "drains_before_rain": {
                "before_pct": round(drains_pct(*before)),
                "after_pct": round(drains_pct(*after)),
                "heavy_rain_mm": kpi.HEAVY_RAIN_MM,
                "lead_days": kpi.DRAIN_LEAD_DAYS,
            },
            "team_hours_saved": {
                "per_quarter": hours_saved,
                "avoided_cleanings": avoided,
                "avg_team_hours_per_cleaning": avg_team_hours,
                "estimate": True,
            },
        },
    }

    # ---- comparativo anual
    yearly = []
    for year in range(2022, 2027):
        full = (datetime(year, 1, 1), min(datetime(year + 1, 1, 1), REF))
        same = (datetime(year, 1, 1), datetime(year, REF.month, REF.day))
        h2 = window(year)

        def floods(start: datetime, end: datetime) -> int:
            return sum(1 for e in flood_events if start.date() <= e["date"] < end.date())

        def block(span: tuple[datetime, datetime], floods=floods) -> dict:
            return {
                "debris_episodes": episode_count(*span),
                "recurrences": recurrences(*span),
                "flood_events": floods(*span),
            }

        yearly.append(
            {
                "year": year,
                "partial": year == REF.year,
                "full_year": block(full),
                "jan_to_ref": block(same),
                "jul_to_ref": block(h2),
                "avg_days_clean": kpi.mean_days_clean(rec_cleanings, starts_by_point, *h2),
                "avg_days_to_clean": kpi.mean_days_to_clean(clean_pairs, *h2),
                "drains_before_rain_pct": drains_pct(*h2),
                "team_hours": round(
                    sum(c["team_hours"] for c in cleanings if full[0] <= c["date"] < full[1])
                ),
            }
        )

    # ---- próximos 3 meses: sem ação × com o plano
    flood_counts: dict[tuple[int, int], int] = defaultdict(int)
    for e in flood_events:
        flood_counts[(e["date"].year, e["date"].month)] += 1
    month_labels = {12: "dez/26", 1: "jan/27", 2: "fev/27"}
    months = []
    for (year, month), r_without, r_with in zip(forecast_months, rec_without, rec_with,
                                                strict=True):  # fmt: skip
        ms, me = month_bounds(year, month)
        debris_without = round(monthly_baseline(ep_counts, month, baseline_years(month)))
        floods_without = round(monthly_baseline(flood_counts, month, baseline_years(month)))
        seasonal = events_between(ms.date(), (me - timedelta(days=1)).date())
        months.append(
            {
                "month": f"{year}-{month:02d}",
                "label": month_labels[month],
                "debris_episodes": {"without_action": debris_without,
                                    "with_plan": debris_without - (r_without - r_with)},
                "recurrences": {"without_action": r_without, "with_plan": r_with},
                "flood_events": {"without_action": floods_without,
                                 "with_plan": apply_plan(floods_without, PLAN_FLOOD_EFFECT)},
                "seasonal_events": sorted({e.name for e in seasonal if e.key != "feriado"}),
            }
        )  # fmt: skip

    def total(field: str, key: str) -> int:
        return sum(m[field][key] for m in months)

    next3 = {
        "baseline": "média do mesmo mês nas temporadas 2022/23 a 2025/26 (antes das previsões)",
        "plan_effects": {"recurrence": PLAN_RECURRENCE_EFFECT, "flood": PLAN_FLOOD_EFFECT},
        "months": months,
        "totals": {
            field: {
                "without_action": total(field, "without_action"),
                "with_plan": total(field, "with_plan"),
                "change_pct": round(
                    kpi.pct_change(total(field, "without_action"), total(field, "with_plan"))
                ),
            }
            for field in ("debris_episodes", "recurrences", "flood_events")
        },
        "team_hours_saved": hours_saved,
    }

    # ---- alertas
    alerts = []

    def add_alert(**fields: object) -> None:
        alerts.append({"id": f"AL-{len(alerts) + 1:03d}", "created_at": iso(REF), **fields})

    for f in sorted(high_72h, key=lambda f: -f["risk"]["72h"]["score"]):
        fa = fa_by_id[f["flood_area_id"]]
        score = f["risk"]["72h"]["score"]
        add_alert(
            type="flood_high_risk",
            severity="critical" if score >= 80 else "high",
            title=f"Risco alto de alagamento — {fa['name']}",
            message=(
                f"Risco {score}/100 nas próximas 72 h: chuva prevista de {storm_24h:.0f} mm em "
                f"24 h, {f['factors']['clogged_drains']} de {f['factors']['total_drains']} bocas "
                f"de lobo entupidas e {f['factors']['waste_points_nearby']} ponto(s) de lixo "
                "ativo(s) por perto."
            ),
            flood_area_id=fa["id"],
            horizon="72h",
            score=score,
        )
    for point_id in sorted(chronic_ids, key=lambda i: -fc_by_point[i]["episodes_last_15d"]):
        p, f = point_by_id[point_id], fc_by_point[point_id]
        pat = f["hour_pattern"]
        when = f"entre {pat['start_hour']}h e {pat['end_hour']}h" if pat else "no horário provável"
        add_alert(
            type="chronic_recurrence",
            severity="high",
            title=f"Reincidência crônica — ponto {point_id} ({area_name[p['area_id']]})",
            message=(
                f"{f['episodes_last_15d']} episódios em {DEFAULT_WINDOW_DAYS} dias "
                f"(limite: {DEFAULT_MIN_EPISODES}). Limpeza sozinha não está resolvendo."
            ),
            point_id=point_id,
            area_id=p["area_id"],
        )
        add_alert(
            type="awareness",
            severity="medium",
            title=f"Ação de conscientização sugerida — ponto {point_id}",
            message="O ponto voltou a acumular lixo logo após cada limpeza. Combine a limpeza "
            "com ações no entorno.",
            point_id=point_id,
            area_id=p["area_id"],
            suggestions=[
                "Instalar placa informando o ponto de entrega mais próximo",
                "Ação porta a porta com os moradores e comércios do entorno",
                f"Fiscalização {when}",
                "Recuperação do espaço (plantio, iluminação, pintura)",
            ],
        )
    for ev in events_between(REF.date(), REF.date() + timedelta(days=100)):
        if ev.key == "feriado":
            continue
        add_alert(
            type="seasonal_event",
            severity="info",
            title=f"Evento sazonal — {ev.name}",
            message=f"{ev.description} De {ev.start:%d/%m/%Y} a {ev.end:%d/%m/%Y}.",
            starts_on=ev.start.isoformat(),
            ends_on=ev.end.isoformat(),
        )
    soon_by_area: dict[str, int] = defaultdict(int)
    for f in point_forecasts:
        if f["expected_within_7d"]:
            soon_by_area[point_by_id[f["point_id"]]["area_id"]] += 1
    for area_id, count in sorted(soon_by_area.items(), key=lambda kv: -kv[1])[:4]:
        add_alert(
            type="debris_forecast",
            severity="medium",
            title=f"Entulho previsto — {area_name[area_id]}",
            message=f"{count} ponto(s) com acúmulo previsto nos próximos 7 dias.",
            area_id=area_id,
            points=count,
        )

    # ---- gravação
    write_json("areas.json", areas)
    write_json(
        "points.json",
        [{k: p[k] for k in ("id", "area_id", "lat", "lon", "waste_type")} for p in points],
        compact=True,
    )
    write_json(
        "episodes.json",
        [
            {"id": e["id"], "point_id": e["point_id"], "start": iso(e["start"]),
             "end": iso(e["end"]), "reports": e["reports"], "volume_m3": e["volume_m3"]}
            for e in episodes
        ],
        compact=True,
    )  # fmt: skip
    cleanings.sort(key=lambda c: c["date"])
    write_json("cleanings.json", [{**c, "date": iso(c["date"])} for c in cleanings], compact=True)
    write_json(
        "flood_areas.json",
        [{k: v for k, v in fa.items() if not k.startswith("_")} for fa in flood_areas],
    )
    write_json("drains.json", drains, compact=True)
    write_json(
        "flood_events.json",
        [
            {"id": e["id"], "flood_area_id": e["flood_area_id"], "date": e["date"].isoformat(),
             "rain_mm": e["rain_mm"], "severity": e["severity"], "predicted": e["predicted"]}
            for e in flood_events
        ],
        compact=True,
    )  # fmt: skip
    write_json(
        "rain.json",
        {
            "unit": "mm/dia",
            "heavy_rain_mm": kpi.HEAVY_RAIN_MM,
            "observed": [[d.isoformat(), mm] for d, mm in observed],
            "forecast": [[d.isoformat(), mm] for d, mm in forecast_rain],
            "horizons": horizons,
        },
        compact=True,
    )
    write_json("forecasts.json", {"as_of": iso(REF), "points": point_forecasts,
                                  "flood_areas": area_forecasts}, compact=True)  # fmt: skip
    write_json("kpis.json", kpis_payload)
    write_json("yearly.json", yearly)
    write_json("next3months.json", next3)
    write_json("alerts.json", alerts)
    write_users()
    files = sorted(f.name for f in DATA_DIR.glob("*.json") if f.name != "meta.json")
    write_json(
        "meta.json",
        {
            "version": __version__,
            "generated_at": datetime.now(TZ).isoformat(timespec="seconds"),
            "reference_date": iso(REF),
            "system_start": SYSTEM_START.date().isoformat(),
            "seed": SEED,
            "weather_seed": weather_seed,
            "simulated": True,
            "notice": "Dados simulados para demonstração. Não representam ocorrências reais.",
            "coordinates_notice": "Coordenadas aproximadas (referência: OpenStreetMap).",
            "calibration": [
                "Londrina produziu em média ~377 t/dia de lixo doméstico em 2025 (Perfil de "
                "Londrina/CMTU).",
                "A CMTU limpou 904 bocas de lobo entre jan e set de 2025.",
            ],
            "counts": {
                "areas": len(areas),
                "points": len(points),
                "episodes": len(episodes),
                "cleanings": len(cleanings),
                "flood_areas": len(flood_areas),
                "drains": len(drains),
                "flood_events": len(flood_events),
                "alerts": len(alerts),
            },
            "files": files,
        },
    )

    size = sum(f.stat().st_size for f in DATA_DIR.glob("*.json"))
    print(f"Arquivos gerados em {DATA_DIR} ({size / 1e6:.2f} MB)")
    print(json.dumps(kpis_payload["map"], ensure_ascii=False))
    print(json.dumps(kpis_payload["impact"], ensure_ascii=False))
    print("yearly:", [(y["year"], y["full_year"], y["jul_to_ref"], y["avg_days_clean"],
                       y["drains_before_rain_pct"]) for y in yearly])  # fmt: skip
    print("next3:", json.dumps(next3["totals"]), "horas:", hours_saved)
    print("72h alto:", [fa_by_id[f["flood_area_id"]]["name"] for f in high_72h],
          "chuva:", storm_24h)  # fmt: skip
    for key in ("24h", "3m"):
        n_high = sum(1 for f in area_forecasts if f["risk"][key]["level"] == "alto")
        print(f"{key} alto:", n_high)


def write_users() -> None:
    """Cria data/users.json (só hashes Argon2). Ver docstring do módulo."""
    path = DATA_DIR / "users.json"
    supplied = dict(
        item.split("=", 1)
        for item in os.environ.get("DEMO_PASSWORDS", "").split(",")
        if "=" in item
    )
    if path.exists() and not supplied:
        return
    from argon2 import PasswordHasher

    hasher = PasswordHasher()
    users = []
    for user_id, role, name, email, job_title in USERS:
        password = supplied.get(role)
        if password is None:
            password = secrets.token_urlsafe(9)
            print(f"Senha gerada para {email}: {password} (anote no README)")
        users.append(
            {"id": user_id, "name": name, "email": email, "role": role, "job_title": job_title,
             "password_hash": hasher.hash(password)}
        )  # fmt: skip
    write_json("users.json", users)


POST_FLOOD_FACTOR = 0.5  # efeito simulado do sistema sobre os alagamentos após jul/2026
G_POST = 13.5  # média (dias) do intervalo limpeza → novo despejo após jul/2026

if __name__ == "__main__":
    main()
