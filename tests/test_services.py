"""Testes das regras de negócio (backend/services)."""

from datetime import date, datetime, timedelta

import pytest

from backend.services import kpis
from backend.services.episodes import Report, group_reports, nearest_point
from backend.services.flood_risk import flood_risk_score, risk_level
from backend.services.forecast import hour_pattern, predict_next_accumulation
from backend.services.geo import haversine_m
from backend.services.projection import PLAN_RECURRENCE_EFFECT, apply_plan, monthly_baseline
from backend.services.recurrence import (
    count_recurrences,
    episodes_in_window,
    is_chronic,
    was_ever_chronic,
)
from backend.services.seasonality import carnival, debris_factor, events_between, flood_factor

LAT, LON = -23.31, -51.16
M_PER_DEG_LAT = 111_194.9
T0 = datetime(2026, 11, 1, 8, 0)


def north(meters: float) -> float:
    return LAT + meters / M_PER_DEG_LAT


# ------------------------------------------------------------- agrupamento


def test_haversine_known_distance():
    assert haversine_m(LAT, LON, north(150), LON) == pytest.approx(150, abs=0.5)


def test_reports_close_in_space_and_time_form_one_episode():
    reports = [
        Report(LAT, LON, T0),
        Report(north(60), LON, T0 + timedelta(hours=5)),
        Report(north(120), LON, T0 + timedelta(hours=30)),
    ]
    episodes = group_reports(reports)
    assert len(episodes) == 1
    assert episodes[0].n_reports == 3
    assert episodes[0].start == T0
    assert episodes[0].end == T0 + timedelta(hours=30)


def test_distance_limit_is_150_m():
    inside = group_reports([Report(LAT, LON, T0), Report(north(149), LON, T0)])
    outside = group_reports([Report(LAT, LON, T0), Report(north(151), LON, T0)])
    assert len(inside) == 1
    assert len(outside) == 2


def test_time_limit_is_48_h():
    same = group_reports([Report(LAT, LON, T0), Report(LAT, LON, T0 + timedelta(hours=48))])
    other = group_reports(
        [Report(LAT, LON, T0), Report(LAT, LON, T0 + timedelta(hours=48, minutes=1))]
    )
    assert len(same) == 1
    assert len(other) == 2


def test_chain_of_reports_keeps_same_episode():
    reports = [Report(LAT, LON, T0 + timedelta(hours=40 * i)) for i in range(4)]
    assert len(group_reports(reports)) == 1


def test_grouping_ignores_input_order_and_custom_limits():
    reports = [Report(LAT, LON, T0 + timedelta(hours=10)), Report(LAT, LON, T0)]
    assert len(group_reports(reports)) == 1
    assert len(group_reports(reports, max_hours=5)) == 2
    far = [Report(LAT, LON, T0), Report(north(300), LON, T0)]
    assert len(group_reports(far, max_distance_m=400)) == 1


def test_nearest_point():
    points = [("D-0001", LAT, LON), ("D-0002", north(400), LON)]
    assert nearest_point(north(30), LON, points) == "D-0001"
    assert nearest_point(north(380), LON, points) == "D-0002"
    assert nearest_point(north(200), LON, points) is None


# ---------------------------------------------------------- reincidência


def test_chronic_needs_three_episodes_in_15_days():
    as_of = datetime(2026, 11, 14, 6, 0)
    two = [as_of - timedelta(days=2), as_of - timedelta(days=9)]
    three = two + [as_of - timedelta(days=14)]
    assert not is_chronic(two, as_of)
    assert is_chronic(three, as_of)
    assert episodes_in_window(three, as_of) == 3


def test_chronic_window_boundary_is_inclusive_at_15_days():
    as_of = datetime(2026, 11, 14, 6, 0)
    base = [as_of - timedelta(days=1), as_of - timedelta(days=5)]
    assert is_chronic(base + [as_of - timedelta(days=15)], as_of)
    assert not is_chronic(base + [as_of - timedelta(days=15, minutes=1)], as_of)


def test_chronic_limits_are_configurable():
    as_of = datetime(2026, 11, 14, 6, 0)
    starts = [as_of - timedelta(days=d) for d in (1, 8, 14)]
    assert is_chronic(starts, as_of)
    assert not is_chronic(starts, as_of, window_days=7)
    assert is_chronic(starts, as_of, window_days=7, min_episodes=1)
    assert not is_chronic(starts, as_of, min_episodes=4)


def test_was_ever_chronic_and_recurrences():
    starts = [datetime(2025, 3, d) for d in (1, 6, 12)] + [datetime(2025, 8, 1)]
    assert was_ever_chronic(starts)
    assert not was_ever_chronic(starts, period_start=datetime(2025, 6, 1))
    # 6/3 e 12/3 voltaram em até 30 dias; 1/8 veio 142 dias depois.
    assert count_recurrences(starts, datetime(2025, 1, 1), datetime(2026, 1, 1)) == 2
    assert count_recurrences(starts, datetime(2025, 3, 10), datetime(2026, 1, 1)) == 1
    assert count_recurrences(starts, datetime(2025, 1, 1), datetime(2026, 1, 1), within_days=5) == 1


# ---------------------------------------------------------------- previsão


def test_forecast_needs_two_episodes():
    assert predict_next_accumulation([], T0) is None
    assert predict_next_accumulation([T0 - timedelta(days=3)], T0) is None


def test_forecast_range_around_mean_interval():
    as_of = datetime(2026, 11, 14, 6, 0)
    starts = [as_of - timedelta(days=2 + 5 * i) for i in range(9)]  # a cada 5 dias
    fc = predict_next_accumulation(starts, as_of)
    assert fc.mean_interval_days == 5.0
    assert fc.days_min <= 3 <= fc.days_max  # próximo acúmulo esperado em 3 dias
    assert fc.days_expected == 3
    assert fc.days_max - fc.days_min >= 1
    assert fc.date_min == (as_of + timedelta(days=fc.days_min)).date()
    assert fc.confidence == "alta"
    assert not fc.overdue


def test_forecast_confidence_depends_on_amount_of_data():
    as_of = datetime(2026, 11, 14, 6, 0)

    def every_5_days(n: int) -> list[datetime]:
        return [as_of - timedelta(days=1 + 5 * i) for i in range(n)]

    assert predict_next_accumulation(every_5_days(2), as_of).confidence == "baixa"
    assert predict_next_accumulation(every_5_days(4), as_of).confidence == "média"
    assert predict_next_accumulation(every_5_days(8), as_of).confidence == "alta"
    irregular = [as_of - timedelta(days=d) for d in (1, 3, 30, 33, 90, 91, 200, 204)]
    assert predict_next_accumulation(irregular, as_of).confidence == "média"


def test_forecast_seasonal_factor_brings_date_forward():
    as_of = datetime(2026, 11, 14, 6, 0)
    starts = [as_of - timedelta(days=1 + 10 * i) for i in range(6)]
    normal = predict_next_accumulation(starts, as_of)
    festive = predict_next_accumulation(starts, as_of, seasonal_factor=lambda _: 2.0)
    assert festive.days_expected < normal.days_expected
    assert festive.seasonal_factor == 2.0


def test_forecast_overdue_never_returns_negative_days():
    as_of = datetime(2026, 11, 14, 6, 0)
    starts = [as_of - timedelta(days=60 + 5 * i) for i in range(6)]
    fc = predict_next_accumulation(starts, as_of)
    assert fc.overdue
    assert fc.days_min == 0
    assert fc.days_max >= 1


def test_hour_pattern_detects_night_dumping():
    night = [datetime(2026, 10, d, 23, 15) for d in range(1, 9)]
    day = [datetime(2026, 10, d, 14, 0) for d in range(1, 3)]
    pattern = hour_pattern(night + day)
    assert pattern.detected
    assert pattern.share == 0.8
    hours = {(pattern.start_hour + k) % 24 for k in range(4)}
    assert 23 in hours
    assert hour_pattern(night[:3]) is None


# ------------------------------------------------------------ sazonalidade


def test_carnival_2027_matches_official_dates():
    assert carnival(2027) == (date(2027, 2, 6), date(2027, 2, 9))
    assert carnival(2026) == (date(2026, 2, 14), date(2026, 2, 17))


def test_seasonal_factors():
    assert debris_factor(date(2026, 12, 25)) == 1.5  # Natal e Ano-Novo
    assert debris_factor(date(2027, 2, 8)) == 1.4  # Carnaval
    assert debris_factor(date(2026, 8, 12)) == 1.0
    assert flood_factor(date(2027, 1, 15)) == 1.6  # chuvas de verão
    assert flood_factor(date(2026, 7, 15)) == 1.0
    names = {e.name for e in events_between(date(2026, 12, 1), date(2027, 2, 28))}
    assert {"Natal e Ano-Novo", "Carnaval", "Volta às aulas", "Chuvas de verão"} <= names


# --------------------------------------------------------- risco de alagamento


def test_flood_risk_bounds_and_levels():
    low = flood_risk_score(0, 0, 0, 0, 6, 0)
    high = flood_risk_score(60, 120, 12, 6, 6, 10)
    assert (low.score, low.level) == (0, "baixo")
    assert (high.score, high.level) == (100, "alto")
    assert risk_level(39) == "baixo"
    assert risk_level(40) == "médio"
    assert risk_level(69) == "médio"
    assert risk_level(70) == "alto"


def test_flood_risk_grows_with_each_factor():
    base = flood_risk_score(10, 20, 2, 1, 6, 1).score
    assert flood_risk_score(30, 20, 2, 1, 6, 1).score > base  # chuva em 3 h
    assert flood_risk_score(10, 60, 2, 1, 6, 1).score > base  # chuva em 24 h
    assert flood_risk_score(10, 20, 6, 1, 6, 1).score > base  # histórico
    assert flood_risk_score(10, 20, 2, 4, 6, 1).score > base  # bocas de lobo entupidas
    assert flood_risk_score(10, 20, 2, 1, 6, 5).score > base  # pontos de lixo próximos


def test_flood_risk_components_add_up():
    r = flood_risk_score(20, 40, 4, 3, 6, 3)
    assert (r.rain, r.history, r.drains, r.waste) == (25.0, 10.0, 10.0, 5.0)
    assert r.score == 50
    assert flood_risk_score(20, 40, 4, 0, 0, 3).drains == 0.0


# --------------------------------------------------------------------- KPIs


def test_mean_days_clean():
    cleanings = {
        "D-1": [datetime(2026, 8, 1), datetime(2026, 8, 20)],
        "D-2": [datetime(2026, 8, 5)],
    }
    episodes = {
        "D-1": [datetime(2026, 7, 30), datetime(2026, 8, 11), datetime(2026, 8, 30)],
        "D-2": [datetime(2026, 8, 4)],  # ainda sem retorno: não entra na média
    }
    period = (datetime(2026, 7, 1), datetime(2026, 11, 14))
    assert kpis.mean_days_clean(cleanings, episodes, *period) == 10.0
    assert kpis.mean_days_clean({}, episodes, *period) is None


def test_mean_days_to_clean_and_pct_change():
    pairs = [
        (datetime(2026, 8, 1), datetime(2026, 8, 3)),
        (datetime(2026, 8, 10), datetime(2026, 8, 11)),
        (datetime(2025, 8, 1), datetime(2025, 8, 9)),  # fora do período
    ]
    assert kpis.mean_days_to_clean(pairs, datetime(2026, 7, 1), datetime(2026, 11, 14)) == 1.5
    assert kpis.pct_change(600, 396) == -34.0
    assert kpis.pct_change(0, 10) is None


def test_flood_hit_rate():
    assert kpis.flood_hit_rate([True] * 7 + [False] * 2) == {
        "occurred": 9,
        "predicted": 7,
        "pct": 78,
    }
    assert kpis.flood_hit_rate([])["pct"] is None


def test_drains_cleaned_before_rain():
    rain_days = [date(2026, 10, 10), date(2026, 10, 20)]
    cleanings = {
        "B-1": [date(2026, 10, 8), date(2026, 10, 15)],  # cobre as duas chuvas
        "B-2": [date(2026, 10, 2)],  # 8 dias antes: fora da janela de 7
        "B-3": [date(2026, 10, 10)],  # no próprio dia da chuva: não conta
    }
    drains = ["B-1", "B-2", "B-3", "B-4"]
    assert kpis.drains_cleaned_before_rain(rain_days, cleanings, drains) == 25.0
    assert kpis.drains_cleaned_before_rain(rain_days, cleanings, drains, lead_days=10) == 50.0
    assert kpis.drains_cleaned_before_rain([], cleanings, drains) is None


def test_team_hours_saved_and_projection():
    assert kpis.team_hours_saved(155, 8.0) == 1240
    counts = {(2023, 1): 100, (2024, 1): 120, (2025, 1): 140}
    assert monthly_baseline(counts, 1, [2023, 2024, 2025]) == 120
    assert apply_plan(120, PLAN_RECURRENCE_EFFECT) == 79
