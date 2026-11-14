"""Agrupamento de relatos em episódios.

Regra de negócio: relatos a até 150 m e 48 h um do outro contam como UM
episódio, para não inflar o número de ocorrências.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from backend.services.geo import haversine_m

MAX_DISTANCE_M = 150.0
MAX_HOURS = 48.0


@dataclass(frozen=True)
class Report:
    """Um relato: só o problema (onde e quando), nunca a pessoa."""

    lat: float
    lon: float
    when: datetime


@dataclass
class Episode:
    reports: list[Report] = field(default_factory=list)

    @property
    def start(self) -> datetime:
        return self.reports[0].when

    @property
    def end(self) -> datetime:
        return self.reports[-1].when

    @property
    def n_reports(self) -> int:
        return len(self.reports)

    @property
    def lat(self) -> float:
        return sum(r.lat for r in self.reports) / len(self.reports)

    @property
    def lon(self) -> float:
        return sum(r.lon for r in self.reports) / len(self.reports)


def group_reports(
    reports: Iterable[Report],
    max_distance_m: float = MAX_DISTANCE_M,
    max_hours: float = MAX_HOURS,
) -> list[Episode]:
    """Agrupa relatos em episódios.

    Um relato entra em um episódio existente quando está a até `max_hours`
    do último relato do episódio E a até `max_distance_m` de algum relato
    dele. Se houver mais de um candidato, vence o mais próximo.
    Os episódios saem em ordem cronológica de início.
    """
    window = timedelta(hours=max_hours)
    episodes: list[Episode] = []
    active: list[Episode] = []
    for report in sorted(reports, key=lambda r: r.when):
        active = [e for e in active if report.when - e.end <= window]
        best: Episode | None = None
        best_distance = 0.0
        for episode in active:
            distance = min(
                haversine_m(report.lat, report.lon, m.lat, m.lon) for m in episode.reports
            )
            if distance <= max_distance_m and (best is None or distance < best_distance):
                best, best_distance = episode, distance
        if best is None:
            best = Episode()
            episodes.append(best)
            active.append(best)
        best.reports.append(report)
    return episodes


def nearest_point(
    lat: float,
    lon: float,
    points: Sequence[tuple[str, float, float]],
    max_distance_m: float = MAX_DISTANCE_M,
) -> str | None:
    """Id do ponto cadastrado mais próximo (até `max_distance_m`), ou None.

    `points` é uma sequência de (id, lat, lon).
    """
    best_id: str | None = None
    best_distance = max_distance_m
    for point_id, plat, plon in points:
        if abs(plat - lat) > 0.01 or abs(plon - lon) > 0.01:
            continue  # descarte rápido: mais de ~1 km
        distance = haversine_m(lat, lon, plat, plon)
        if distance <= best_distance:
            best_id, best_distance = point_id, distance
    return best_id
