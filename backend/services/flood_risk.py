"""Score de risco de alagamento (0–100 → baixo/médio/alto).

Regra de negócio: combina chuva prevista (mm em 3 h e em 24 h), histórico de
eventos da área, bocas de lobo entupidas próximas e pontos de lixo próximos.
"""

from __future__ import annotations

from dataclasses import dataclass

# Pesos (somam 100).
W_RAIN_24H = 30.0
W_RAIN_3H = 20.0
W_HISTORY = 20.0
W_DRAINS = 20.0
W_WASTE = 10.0

# Valores em que cada componente satura.
RAIN_24H_FULL_MM = 80.0
RAIN_3H_FULL_MM = 40.0
HISTORY_FULL_EVENTS_PER_YEAR = 8.0
WASTE_FULL_POINTS = 6.0

HIGH_THRESHOLD = 70.0
MEDIUM_THRESHOLD = 40.0


@dataclass(frozen=True)
class FloodRisk:
    score: int
    level: str  # "baixo" | "médio" | "alto"
    rain: float
    history: float
    drains: float
    waste: float


def risk_level(score: float) -> str:
    if score >= HIGH_THRESHOLD:
        return "alto"
    if score >= MEDIUM_THRESHOLD:
        return "médio"
    return "baixo"


def _ratio(value: float, full: float) -> float:
    return max(0.0, min(1.0, value / full)) if full > 0 else 0.0


def flood_risk_score(
    rain_3h_mm: float,
    rain_24h_mm: float,
    events_per_year: float,
    clogged_drains: int,
    total_drains: int,
    waste_points_nearby: int,
) -> FloodRisk:
    """Calcula o risco de alagamento de uma área para um horizonte."""
    rain = W_RAIN_24H * _ratio(rain_24h_mm, RAIN_24H_FULL_MM) + W_RAIN_3H * _ratio(
        rain_3h_mm, RAIN_3H_FULL_MM
    )
    history = W_HISTORY * _ratio(events_per_year, HISTORY_FULL_EVENTS_PER_YEAR)
    drains = W_DRAINS * _ratio(clogged_drains, total_drains) if total_drains else 0.0
    waste = W_WASTE * _ratio(waste_points_nearby, WASTE_FULL_POINTS)
    score = round(rain + history + drains + waste)
    return FloodRisk(
        score=score,
        level=risk_level(score),
        rain=round(rain, 1),
        history=round(history, 1),
        drains=round(drains, 1),
        waste=round(waste, 1),
    )
