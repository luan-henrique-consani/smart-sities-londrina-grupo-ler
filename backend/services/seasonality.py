"""Calendário sazonal de Londrina e fatores de ajuste.

Fator > 1 significa mais entulho (ou mais chuva) que o normal no período.
As datas da ExpoLondrina e das janelas em torno dos feriados são aproximadas.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from functools import lru_cache


@dataclass(frozen=True)
class SeasonalEvent:
    key: str
    name: str
    start: date
    end: date  # inclusive
    debris_factor: float
    flood_factor: float
    description: str


def easter(year: int) -> date:
    """Domingo de Páscoa (algoritmo gregoriano anônimo)."""
    a = year % 19
    b, c = divmod(year, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    ell = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * ell) // 451
    month, day = divmod(h + ell - 7 * m + 114, 31)
    return date(year, month, day + 1)


def carnival(year: int) -> tuple[date, date]:
    """Sábado e terça-feira de Carnaval."""
    tuesday = easter(year) - timedelta(days=47)
    return tuesday - timedelta(days=3), tuesday


@lru_cache(maxsize=32)
def events_for_year(year: int) -> tuple[SeasonalEvent, ...]:
    """Eventos sazonais que começam no ano informado."""
    saturday, tuesday = carnival(year)
    pascoa = easter(year)
    events = [
        SeasonalEvent(
            "volta_as_aulas",
            "Volta às aulas",
            date(year, 1, 25),
            date(year, 2, 15),
            1.1,
            1.0,
            "Mais descarte de móveis e materiais no início do ano letivo.",
        ),
        SeasonalEvent(
            "carnaval",
            "Carnaval",
            saturday - timedelta(days=2),
            tuesday + timedelta(days=3),
            1.4,
            1.0,
            "Blocos e feriado prolongado elevam o volume de entulho e lixo nas ruas.",
        ),
        SeasonalEvent(
            "expolondrina",
            "ExpoLondrina",
            date(year, 4, 1),
            date(year, 4, 15),
            1.2,
            1.0,
            "Grande fluxo de visitantes na cidade (datas aproximadas).",
        ),
        SeasonalEvent(
            "chuvas_de_verao",
            "Chuvas de verão",
            date(year, 12, 1),
            date(year + 1, 3, 31),
            1.0,
            1.6,
            "Temporais frequentes de dezembro a março elevam o risco de alagamento.",
        ),
        SeasonalEvent(
            "fim_de_ano",
            "Natal e Ano-Novo",
            date(year, 12, 15),
            date(year + 1, 1, 6),
            1.5,
            1.0,
            "Festas, reformas e troca de móveis elevam o descarte de entulho.",
        ),
    ]
    holidays = [
        ("Paixão de Cristo e Páscoa", pascoa - timedelta(days=2), pascoa),
        ("Tiradentes", date(year, 4, 21), date(year, 4, 21)),
        ("Dia do Trabalho", date(year, 5, 1), date(year, 5, 1)),
        ("Corpus Christi", pascoa + timedelta(days=60), pascoa + timedelta(days=60)),
        ("Independência", date(year, 9, 7), date(year, 9, 7)),
        ("Nossa Senhora Aparecida", date(year, 10, 12), date(year, 10, 12)),
        ("Finados", date(year, 11, 2), date(year, 11, 2)),
        ("Proclamação da República", date(year, 11, 15), date(year, 11, 15)),
    ]
    for name, start, end in holidays:
        events.append(
            SeasonalEvent(
                "feriado",
                f"Feriado prolongado — {name}",
                start - timedelta(days=2),
                end + timedelta(days=2),
                1.15,
                1.0,
                "Feriados prolongados costumam aumentar o descarte irregular.",
            )
        )
    return tuple(sorted(events, key=lambda e: e.start))


def events_between(start: date, end: date) -> list[SeasonalEvent]:
    """Eventos que tocam o intervalo [start, end], em ordem de início."""
    found = [
        event
        for year in range(start.year - 1, end.year + 1)
        for event in events_for_year(year)
        if event.start <= end and event.end >= start
    ]
    return sorted(found, key=lambda e: (e.start, e.key))


def _as_date(day: date | datetime) -> date:
    return day.date() if isinstance(day, datetime) else day


def debris_factor(day: date | datetime) -> float:
    """Fator sazonal de entulho no dia (1.0 = normal)."""
    d = _as_date(day)
    return max((e.debris_factor for e in events_between(d, d)), default=1.0)


def flood_factor(day: date | datetime) -> float:
    """Fator sazonal de chuva/alagamento no dia (1.0 = normal)."""
    d = _as_date(day)
    return max((e.flood_factor for e in events_between(d, d)), default=1.0)
