"""Os cinco indicadores obrigatórios.

1. Reincidência                       → recurrence.count_recurrences + pct_change
2. Dias que o ponto fica limpo        → mean_days_clean
3. Alagamentos previstos × ocorridos  → flood_hit_rate
4. Bocas de lobo limpas antes de chuva forte → drains_cleaned_before_rain
5. Horas de equipe economizadas       → team_hours_saved (estimativa)
"""

from __future__ import annotations

from bisect import bisect_right
from collections.abc import Iterable, Mapping, Sequence
from datetime import date, datetime

HEAVY_RAIN_MM = 30.0  # chuva forte: 30 mm ou mais em 24 h
DRAIN_LEAD_DAYS = 7  # "antes da chuva" = limpa nos 7 dias anteriores


def pct_change(before: float, after: float) -> float | None:
    """Variação percentual de `before` para `after` (None se before = 0)."""
    if not before:
        return None
    return round((after - before) / before * 100, 1)


def mean_days_clean(
    cleanings_by_point: Mapping[str, Sequence[datetime]],
    episodes_by_point: Mapping[str, Sequence[datetime]],
    period_start: datetime,
    period_end: datetime,
) -> float | None:
    """Média de dias entre uma limpeza e o episódio seguinte no mesmo ponto.

    Conta as limpezas feitas em [period_start, period_end) cujo retorno do
    lixo já foi observado. As listas de episódios devem estar ordenadas.
    """
    gaps: list[float] = []
    for point_id, cleanings in cleanings_by_point.items():
        starts = episodes_by_point.get(point_id, ())
        for cleaned_at in cleanings:
            if not period_start <= cleaned_at < period_end:
                continue
            i = bisect_right(starts, cleaned_at)
            if i < len(starts):
                gaps.append((starts[i] - cleaned_at).total_seconds() / 86400)
    return round(sum(gaps) / len(gaps), 1) if gaps else None


def mean_days_to_clean(
    pairs: Iterable[tuple[datetime, datetime]],
    period_start: datetime,
    period_end: datetime,
) -> float | None:
    """Média de dias entre o início do episódio e a limpeza.

    `pairs` = (início do episódio, data da limpeza); filtra pelo início.
    """
    waits = [
        (cleaned_at - started_at).total_seconds() / 86400
        for started_at, cleaned_at in pairs
        if period_start <= started_at < period_end
    ]
    return round(sum(waits) / len(waits), 1) if waits else None


def flood_hit_rate(predicted_flags: Iterable[bool]) -> dict[str, float | int | None]:
    """Alagamentos previstos × ocorridos.

    Recebe, para cada alagamento ocorrido, se havia alerta prévio de risco alto.
    """
    flags = list(predicted_flags)
    occurred = len(flags)
    predicted = sum(1 for f in flags if f)
    pct = round(predicted / occurred * 100) if occurred else None
    return {"occurred": occurred, "predicted": predicted, "pct": pct}


def drains_cleaned_before_rain(
    heavy_rain_days: Sequence[date],
    cleanings_by_drain: Mapping[str, Sequence[date]],
    drain_ids: Sequence[str],
    lead_days: int = DRAIN_LEAD_DAYS,
) -> float | None:
    """% de bocas de lobo limpas nos `lead_days` dias antes de cada chuva forte.

    A base é o total de pares (dia de chuva forte, boca de lobo monitorada).
    """
    pairs = len(heavy_rain_days) * len(drain_ids)
    if not pairs:
        return None
    covered = 0
    for day in heavy_rain_days:
        for drain_id in drain_ids:
            if any(0 < (day - c).days <= lead_days for c in cleanings_by_drain.get(drain_id, ())):
                covered += 1
    return round(covered / pairs * 100, 1)


def team_hours_saved(avoided_cleanings: float, avg_team_hours: float) -> int:
    """Estimativa: limpezas evitadas × média de horas de equipe por limpeza."""
    return round(avoided_cleanings * avg_team_hours)
