"""Schemas pydantic da API (entrada e saída)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")

Role = Literal["admin", "gestor", "tecnico", "defesa_civil", "visitante"]
RiskLevel = Literal["baixo", "médio", "alto"]
Horizon = Literal["now", "24h", "72h", "3m"]
WasteType = Literal["entulho", "volumosos", "domestico", "poda", "misto", "pneus"]
Confidence = Literal["alta", "média", "baixa"]
LlmMode = Literal["api", "fallback"]

POINT_ID_PATTERN = r"^D-\d{4}$"
FLOOD_AREA_ID_PATTERN = r"^A-\d{2}$"
AREA_ID_PATTERN = r"^[a-z0-9_]{1,40}$"


class StrictInput(BaseModel):
    """Base das entradas: campos desconhecidos são rejeitados."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


# ----- autenticação -----
class User(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    job_title: str


class LoginRequest(StrictInput):
    email: str = Field(
        min_length=3,
        max_length=254,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        examples=["gestor@londrinalimpa.example"],
    )
    password: str = Field(min_length=1, max_length=128)


class ConsentStatus(BaseModel):
    accepted: bool = Field(description="True se o termo vigente já foi aceito nesta sessão.")
    required_version: str
    accepted_version: str | None = None
    accepted_at: datetime | None = None


class SessionResponse(BaseModel):
    user: User
    expires_at: datetime | None = Field(None, description="Fim da sessão (8 h após o login).")
    consent: ConsentStatus | None = None


# ----- meta -----
class MetaResponse(BaseModel):
    version: str
    generated_at: datetime | None = Field(
        None, description='Horário de geração dos dados ("Atualizado às HH:MM").'
    )
    reference_date: str | None = None
    system_start: str | None = None
    simulated: bool = True
    notice: str
    coordinates_notice: str | None = None
    calibration: list[str] = []
    counts: dict[str, int] = {}
    degraded: bool = Field(False, description="True se algum arquivo usou o seed embutido.")


# ----- pontos de descarte -----
class AccumulationForecast(BaseModel):
    days_min: int
    days_max: int
    days_expected: int
    date_min: date
    date_max: date
    mean_interval_days: float
    seasonal_factor: float
    confidence: Confidence
    overdue: bool
    label: str = Field(description='Faixa em texto, ex.: "em 2 a 7 dias".')


class HourPattern(BaseModel):
    start_hour: int
    end_hour: int
    share: float = Field(description="Fração dos episódios dentro da janela.")
    detected: bool = Field(description="True se a concentração orienta fiscalização.")
    label: str = Field(description='Ex.: "18h–22h".')


class PointSummary(BaseModel):
    id: str
    area_id: str
    area_name: str
    lat: float
    lon: float
    approximate: bool = True
    waste_type: str
    risk: RiskLevel
    chronic: bool
    episodes_last_15d: int
    pending_cleaning: bool
    expected_within_7d: bool
    n_episodes: int
    last_episode: str | None
    next: AccumulationForecast | None = Field(
        description="Próximo acúmulo previsto (None com menos de 2 episódios)."
    )


class Episode(BaseModel):
    id: str
    start: str
    end: str
    reports: int = Field(description="Relatos agrupados neste episódio (150 m / 48 h).")
    volume_m3: float | None = None


class Cleaning(BaseModel):
    kind: str
    date: str
    team_hours: float
    episode_id: str | None = None


class RecurrenceStatus(BaseModel):
    chronic: bool
    episodes_in_window: int
    window_days: int
    min_episodes: int
    message: str
    suggestions: list[str] = Field(description="Ações além da limpeza (só para crônicos).")


class PointStats(BaseModel):
    mean_interval_days: float | None
    city_mean_interval_days: float | None
    team_hours_last_30d: float
    cleanings_last_30d: int
    episodes_total: int


class LinkedFloodArea(BaseModel):
    id: str
    name: str
    distance_m: int
    score_72h: int
    level_72h: RiskLevel


class DecisionCreate(StrictInput):
    recommendation: str = Field(
        min_length=3, max_length=300, description="Recomendação do sistema que motivou a decisão."
    )
    decision: Literal["aceita", "adiada", "rejeitada"]
    intervention: (
        Literal[
            "limpeza",
            "placa",
            "porta_a_porta",
            "fiscalizacao",
            "recuperacao_do_espaco",
            "outra",
        ]
        | None
    ) = Field(None, description="Intervenção planejada (quando a decisão é aceita).")
    planned_date: date | None = None
    notes: str | None = Field(None, max_length=500)


class Decision(BaseModel):
    id: str
    point_id: str
    recommendation: str
    decision: str
    intervention: str | None = None
    planned_date: date | None = None
    notes: str | None = None
    created_at: datetime
    created_by_role: Role
    created_by_id: str


class PointDetail(PointSummary):
    hour_pattern: HourPattern | None
    recurrence: RecurrenceStatus
    stats: PointStats
    linked_flood_area: LinkedFloodArea | None
    episodes: list[Episode] = Field(description="Mais recentes primeiro.")
    cleanings: list[Cleaning] = Field(description="Mais recentes primeiro.")
    cleanings_total: int
    decisions: list[Decision] = Field(description="Decisões registradas (store em memória).")


# ----- alagamentos -----
class RiskComponents(BaseModel):
    rain: float
    history: float
    drains: float
    waste: float


class HorizonRisk(BaseModel):
    score: int
    level: RiskLevel


class FloodFactors(BaseModel):
    events_per_year: float
    clogged_drains: int
    total_drains: int
    waste_points_nearby: int


class FloodArea(BaseModel):
    id: str
    name: str
    area_id: str
    lat: float
    lon: float
    radius_m: float
    approximate: bool = True
    score: int = Field(description="Risco 0–100 no horizonte pedido.")
    level: RiskLevel
    components: RiskComponents
    factors: FloodFactors
    risk_by_horizon: dict[str, HorizonRisk]


class RainHorizon(BaseModel):
    rain_3h_mm: float
    rain_24h_mm: float


class FloodAreasResponse(BaseModel):
    horizon: Horizon
    rain: RainHorizon | None
    items: list[FloodArea]
    total: int
    high_risk: int


# ----- alertas -----
class Alert(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    created_at: str
    type: str
    severity: str
    title: str
    message: str
    point_id: str | None = None
    area_id: str | None = None
    flood_area_id: str | None = None
    horizon: str | None = None
    score: int | None = None
    suggestions: list[str] | None = None
    starts_on: str | None = None
    ends_on: str | None = None


# ----- indicadores e previsões -----
class Period(BaseModel):
    start: str
    end: str
    label: str


class KpiMap(BaseModel):
    high_risk_areas_72h: int = 0
    debris_points_next_7d: int = 0
    chronic_points: int = 0
    drains_cleaned_before_rain_pct: float | None = None


class KpiRecurrence(BaseModel):
    before: float | None = None
    after: float | None = None
    change_pct: float | None = None
    next_3_months_change_pct: float | None = None


class KpiBeforeAfter(BaseModel):
    before: float | None = None
    after: float | None = None
    points_considered: int | None = None


class KpiFloodAccuracy(BaseModel):
    occurred: int | None = None
    predicted: int | None = None
    pct: float | None = None


class KpiDrains(BaseModel):
    before_pct: float | None = None
    after_pct: float | None = None
    heavy_rain_mm: float | None = None
    lead_days: int | None = None


class KpiTeamHours(BaseModel):
    per_quarter: float | None = None
    avoided_cleanings: float | None = None
    avg_team_hours_per_cleaning: float | None = None
    estimate: bool = True


class KpiImpact(BaseModel):
    recurrence: KpiRecurrence = KpiRecurrence()
    days_clean: KpiBeforeAfter = KpiBeforeAfter()
    days_to_clean: KpiBeforeAfter = KpiBeforeAfter()
    flood_accuracy: KpiFloodAccuracy = KpiFloodAccuracy()
    drains_before_rain: KpiDrains = KpiDrains()
    team_hours_saved: KpiTeamHours = KpiTeamHours()


class KpisResponse(BaseModel):
    as_of: str | None = None
    system_start: str | None = None
    periods: dict[str, Period] = {}
    map: KpiMap = KpiMap()
    impact: KpiImpact = KpiImpact()
    simulated: bool = True


class YearCounts(BaseModel):
    debris_episodes: int
    recurrences: int
    flood_events: int


class YearRow(BaseModel):
    year: int
    partial: bool
    full_year: YearCounts
    jan_to_ref: YearCounts
    jul_to_ref: YearCounts
    avg_days_clean: float | None = None
    avg_days_to_clean: float | None = None
    drains_before_rain_pct: float | None = None
    team_hours: float | None = None


class YearlyResponse(BaseModel):
    as_of: str | None
    system_start: str | None
    years: list[YearRow]
    simulated: bool = True


class Scenario(BaseModel):
    without_action: float
    with_plan: float
    change_pct: float | None = None


class MonthProjection(BaseModel):
    month: str
    label: str
    debris_episodes: Scenario
    recurrences: Scenario
    flood_events: Scenario
    seasonal_events: list[str] = []


class Next3MonthsResponse(BaseModel):
    baseline: str = ""
    plan_effects: dict[str, float] = {}
    months: list[MonthProjection] = []
    totals: dict[str, Scenario] = {}
    team_hours_saved: float | None = None
    simulated: bool = True


class SeasonalEventOut(BaseModel):
    key: str
    name: str
    start: date
    end: date
    debris_factor: float
    flood_factor: float
    description: str
    modules: list[Literal["residuos", "alagamentos"]]
    active: bool = Field(description="True se o evento está em curso na data de referência.")
    days_until: int = Field(description="Dias até o início (0 se já começou).")


class SeasonalCalendarResponse(BaseModel):
    start: date
    end: date
    reference_date: date
    events: list[SeasonalEventOut]


# ----- IA -----
Material = Literal["poster", "social", "door_to_door", "action_plan"]
Audience = Literal["moradores", "comerciantes", "escolas", "geral"]
Tone = Literal["amigavel", "informativo", "direto"]
ExplainContext = Literal["map", "forecasts", "point", "flood_area"]


class AwarenessRequest(StrictInput):
    point_id: str = Field(pattern=POINT_ID_PATTERN, examples=["D-0004"])
    material: Material
    audience: Audience = "moradores"
    tone: Tone = "amigavel"
    variant: int | None = Field(
        None, ge=0, le=99, description='Versão do texto ("Gerar outra versão"). Vazio = sorteia.'
    )


class GeneratedText(BaseModel):
    title: str
    text: str
    mode: LlmMode = Field(description='"api" (Claude) ou "fallback" (modelo de texto pronto).')
    model: str | None = Field(None, description='Modelo usado quando mode="api".')
    badge: str
    generated_at: datetime


class AwarenessResponse(GeneratedText):
    point_id: str
    material: Material
    audience: Audience
    tone: Tone
    variant: int


class ExplainResponse(GeneratedText):
    context: ExplainContext
    facts: dict[str, str | int | float | bool | None] = Field(
        description="Números usados no texto (vêm dos modelos estatísticos)."
    )


# ----- logs do cliente -----
class ClientLogIn(StrictInput):
    level: Literal["error", "warning", "info"] = "error"
    message: str = Field(min_length=1, max_length=2000)
    stack: str | None = Field(None, max_length=6000)
    url: str | None = Field(None, max_length=500)
    user_agent: str | None = Field(None, max_length=300)
    component: str | None = Field(None, max_length=120)


class Accepted(BaseModel):
    accepted: bool = True


# ----- LGPD e administração -----
class ConsentIn(StrictInput):
    accepted: Literal[True]
    version: str = Field(min_length=1, max_length=40)


class AuditEntry(BaseModel):
    time: str
    action: str
    user_id: str | None
    role: str | None
    resource: str | None = None
    request_id: str


class AuditResponse(BaseModel):
    retention_days: int
    items: list[AuditEntry]


class DeletionRequest(BaseModel):
    id: str
    user_id: str
    requested_at: str
    status: str
    removed: dict[str, int]
    note: str


class MyDataResponse(BaseModel):
    generated_at: str
    subject: dict[str, str]
    consent: dict[str, str | None] | None
    decisions: list[dict]
    audit_trail: list[AuditEntry]
    deletion_requests: list[DeletionRequest]
    retention: dict[str, str]
    notice: str


class ErrorLogLine(BaseModel):
    time: str
    level: str
    message: str
    request_id: str | None = None


class SystemHealth(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    started_at: str
    uptime_seconds: int
    data_generated_at: datetime | None
    data_files: dict[str, str]
    data_counts: dict[str, int]
    llm_mode: LlmMode
    llm_model: str | None
    sentry_enabled: bool
    error_counts: dict[str, int]
    recent_errors: list[ErrorLogLine]
    recent_client_errors: list[ErrorLogLine]
    memory_store_notice: str
