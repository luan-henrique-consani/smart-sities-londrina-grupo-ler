"""Projeção dos próximos meses: "sem ação preventiva" × "com o plano sugerido".

- Sem ação: média histórica do mesmo mês nos anos anteriores ao sistema.
- Com o plano: a linha de base reduzida pelo efeito esperado do plano.

Os efeitos são premissas do MVP (dados simulados), escolhidas de forma
conservadora em relação à melhora observada desde o início das previsões.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence

# Redução esperada dos retornos de lixo com limpeza preventiva + conscientização.
PLAN_RECURRENCE_EFFECT = 0.34
# Redução esperada de alagamentos com bocas de lobo limpas antes da chuva forte.
PLAN_FLOOD_EFFECT = 0.30


def monthly_baseline(
    counts: Mapping[tuple[int, int], int],
    month: int,
    years: Sequence[int],
) -> float:
    """Média do mês nos anos informados. `counts` é indexado por (ano, mês)."""
    values = [counts.get((year, month), 0) for year in years]
    return sum(values) / len(values) if values else 0.0


def apply_plan(without_action: float, effect: float) -> int:
    """Valor esperado com o plano, arredondado."""
    return round(without_action * (1 - effect))
