"""Previsão de reaparecimento de lixo em um ponto.

Regra de negócio: intervalo médio entre episódios do ponto, ajustado por
sazonalidade, com faixa (ex.: "em 3 a 5 dias") e nível de confiança conforme
a quantidade de dados.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from math import ceil, floor
from statistics import mean, pstdev

MAX_INTERVALS = 8  # usa só os intervalos mais recentes


@dataclass(frozen=True)
class AccumulationForecast:
    days_min: int  # a partir da data de referência
    days_max: int
    days_expected: int  # dias até a data mais provável (negativo = já passou)
    date_min: date
    date_max: date
    mean_interval_days: float  # intervalo médio observado (sem ajuste)
    seasonal_factor: float
    confidence: str  # "alta" | "média" | "baixa"
    n_episodes: int
    overdue: bool  # a faixa prevista já passou: o acúmulo é esperado a qualquer momento


def confidence_level(n_intervals: int, variation: float) -> str:
    """Confiança conforme a quantidade de dados e a regularidade do ponto."""
    if n_intervals >= 6 and variation <= 0.5:
        return "alta"
    if n_intervals >= 3:
        return "média"
    return "baixa"


def predict_next_accumulation(
    starts: Sequence[datetime],
    as_of: datetime,
    seasonal_factor: Callable[[datetime], float] | None = None,
    max_intervals: int = MAX_INTERVALS,
) -> AccumulationForecast | None:
    """Prevê o próximo acúmulo. Retorna None se houver menos de 2 episódios."""
    ordered = sorted(s for s in starts if s <= as_of)
    if len(ordered) < 2:
        return None
    recent = ordered[-(max_intervals + 1) :]
    intervals = [
        (b - a).total_seconds() / 86400 for a, b in zip(recent, recent[1:], strict=False)
    ]
    avg = mean(intervals)
    spread = pstdev(intervals) if len(intervals) > 1 else avg * 0.5
    last = ordered[-1]

    factor = 1.0
    if seasonal_factor is not None:
        factor = max(0.1, seasonal_factor(last + timedelta(days=avg)))
    adjusted = avg / factor
    half_range = max(1.0, 0.5 * spread / factor)

    expected = last + timedelta(days=adjusted)
    earliest = expected - timedelta(days=half_range)
    latest = expected + timedelta(days=half_range)

    overdue = latest < as_of
    days_min = max(0, floor((earliest - as_of).total_seconds() / 86400))
    days_max = max(days_min + 1, ceil((latest - as_of).total_seconds() / 86400))

    return AccumulationForecast(
        days_min=days_min,
        days_max=days_max,
        days_expected=round((expected - as_of).total_seconds() / 86400),
        date_min=(as_of + timedelta(days=days_min)).date(),
        date_max=(as_of + timedelta(days=days_max)).date(),
        mean_interval_days=round(avg, 1),
        seasonal_factor=factor,
        confidence=confidence_level(len(intervals), spread / avg if avg else 0.0),
        n_episodes=len(ordered),
        overdue=overdue,
    )


@dataclass(frozen=True)
class HourPattern:
    start_hour: int  # início da janela (0–23)
    end_hour: int  # fim da janela (exclusivo, módulo 24)
    share: float  # fração dos episódios dentro da janela
    detected: bool  # True se a concentração é forte o bastante para orientar fiscalização


def hour_pattern(
    starts: Sequence[datetime],
    window_hours: int = 4,
    min_episodes: int = 5,
    min_share: float = 0.5,
) -> HourPattern | None:
    """Janela de horário em que o descarte mais acontece (horário provável)."""
    if len(starts) < min_episodes:
        return None
    by_hour = [0] * 24
    for s in starts:
        by_hour[s.hour] += 1
    best_start, best_count = 0, -1
    for h in range(24):
        count = sum(by_hour[(h + k) % 24] for k in range(window_hours))
        if count > best_count:
            best_start, best_count = h, count
    share = best_count / len(starts)
    return HourPattern(
        start_hour=best_start,
        end_hour=(best_start + window_hours) % 24,
        share=round(share, 2),
        detected=share >= min_share,
    )
