"""Reincidência: reincidente crônico e contagem de retornos.

Regra de negócio: reincidente crônico = 3 ou mais episódios no mesmo ponto
em 15 dias. Os dois limites são configuráveis.
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime, timedelta

DEFAULT_WINDOW_DAYS = 15
DEFAULT_MIN_EPISODES = 3
DEFAULT_RECURRENCE_DAYS = 30


def episodes_in_window(
    starts: Sequence[datetime],
    as_of: datetime,
    window_days: int = DEFAULT_WINDOW_DAYS,
) -> int:
    """Quantos episódios começaram nos últimos `window_days` dias (inclusive)."""
    limit = as_of - timedelta(days=window_days)
    return sum(1 for s in starts if limit <= s <= as_of)


def is_chronic(
    starts: Sequence[datetime],
    as_of: datetime,
    window_days: int = DEFAULT_WINDOW_DAYS,
    min_episodes: int = DEFAULT_MIN_EPISODES,
) -> bool:
    """True se o ponto é reincidente crônico ATIVO na data `as_of`."""
    return episodes_in_window(starts, as_of, window_days) >= min_episodes


def was_ever_chronic(
    starts: Sequence[datetime],
    window_days: int = DEFAULT_WINDOW_DAYS,
    min_episodes: int = DEFAULT_MIN_EPISODES,
    period_start: datetime | None = None,
    period_end: datetime | None = None,
) -> bool:
    """True se, em algum momento do período, houve `min_episodes` em `window_days`."""
    ordered = sorted(
        s
        for s in starts
        if (period_start is None or s >= period_start) and (period_end is None or s < period_end)
    )
    window = timedelta(days=window_days)
    for i in range(len(ordered) - min_episodes + 1):
        if ordered[i + min_episodes - 1] - ordered[i] <= window:
            return True
    return False


def count_recurrences(
    starts: Sequence[datetime],
    period_start: datetime,
    period_end: datetime,
    within_days: int = DEFAULT_RECURRENCE_DAYS,
) -> int:
    """Conta os retornos de um ponto no período [period_start, period_end).

    Retorno (reincidência) = episódio que começa até `within_days` dias depois
    do episódio anterior no mesmo ponto.
    """
    ordered = sorted(starts)
    limit = timedelta(days=within_days)
    total = 0
    for previous, current in zip(ordered, ordered[1:], strict=False):
        if period_start <= current < period_end and current - previous <= limit:
            total += 1
    return total
