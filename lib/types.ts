/** Tipos dos contratos da API (espelham backend/models/schemas.py). */

export type Role = "admin" | "gestor" | "tecnico" | "defesa_civil" | "visitante";
export type RiskLevel = "baixo" | "médio" | "alto";
export type Horizon = "now" | "24h" | "72h" | "3m";
export type Severity = "critical" | "high" | "medium" | "info";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  job_title: string;
};

export type ConsentStatus = {
  accepted: boolean;
  required_version: string;
  accepted_version: string | null;
  accepted_at: string | null;
};

export type SessionResponse = {
  user: User;
  expires_at: string | null;
  consent: ConsentStatus | null;
};

export type ErrorLogLine = { time: string; level: string; message: string; request_id: string | null };

export type SystemHealth = {
  status: "ok" | "degraded";
  version: string;
  started_at: string;
  uptime_seconds: number;
  data_generated_at: string | null;
  data_files: Record<string, string>;
  data_counts: Record<string, number>;
  llm_mode: "api" | "fallback";
  llm_model: string | null;
  sentry_enabled: boolean;
  error_counts: Record<string, number>;
  recent_errors: ErrorLogLine[];
  recent_client_errors: ErrorLogLine[];
  memory_store_notice: string;
};

export type AuditEntry = {
  time: string;
  action: string;
  user_id: string | null;
  role: string | null;
  resource: string | null;
  request_id: string;
};

export type AuditResponse = { retention_days: number; items: AuditEntry[] };

export type DeletionRequest = {
  id: string;
  user_id: string;
  requested_at: string;
  status: string;
  removed: Record<string, number>;
  note: string;
};

export type Meta = {
  version: string;
  generated_at: string | null;
  reference_date: string | null;
  system_start: string | null;
  simulated: boolean;
  notice: string;
  coordinates_notice: string | null;
  calibration: string[];
  counts: Record<string, number>;
  degraded: boolean;
};

export type Health = { status: "ok" | "degraded"; version: string; time: string };

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type AccumulationForecast = {
  days_min: number;
  days_max: number;
  days_expected: number;
  date_min: string;
  date_max: string;
  mean_interval_days: number;
  seasonal_factor: number;
  confidence: "alta" | "média" | "baixa";
  overdue: boolean;
  label: string;
};

export type PointSummary = {
  id: string;
  area_id: string;
  area_name: string;
  lat: number;
  lon: number;
  approximate: boolean;
  waste_type: string;
  risk: RiskLevel;
  chronic: boolean;
  episodes_last_15d: number;
  pending_cleaning: boolean;
  expected_within_7d: boolean;
  n_episodes: number;
  last_episode: string | null;
  next: AccumulationForecast | null;
};

export type HorizonRisk = { score: number; level: RiskLevel };

export type FloodArea = {
  id: string;
  name: string;
  area_id: string;
  lat: number;
  lon: number;
  radius_m: number;
  approximate: boolean;
  score: number;
  level: RiskLevel;
  components: { rain: number; history: number; drains: number; waste: number };
  factors: {
    events_per_year: number;
    clogged_drains: number;
    total_drains: number;
    waste_points_nearby: number;
  };
  risk_by_horizon: Record<string, HorizonRisk>;
};

export type FloodAreasResponse = {
  horizon: Horizon;
  rain: { rain_3h_mm: number; rain_24h_mm: number } | null;
  items: FloodArea[];
  total: number;
  high_risk: number;
};

export type Alert = {
  id: string;
  created_at: string;
  type: string;
  severity: Severity | string;
  title: string;
  message: string;
  point_id: string | null;
  area_id: string | null;
  flood_area_id: string | null;
  horizon: string | null;
  score: number | null;
  suggestions: string[] | null;
  starts_on: string | null;
  ends_on: string | null;
  points?: number;
};

export type Kpis = {
  as_of: string | null;
  system_start: string | null;
  map: {
    high_risk_areas_72h: number;
    debris_points_next_7d: number;
    chronic_points: number;
    drains_cleaned_before_rain_pct: number | null;
  };
  impact: {
    recurrence: { before: number | null; after: number | null; change_pct: number | null; next_3_months_change_pct: number | null };
    days_clean: { before: number | null; after: number | null };
    days_to_clean: { before: number | null; after: number | null };
    flood_accuracy: { occurred: number | null; predicted: number | null; pct: number | null };
    drains_before_rain: { before_pct: number | null; after_pct: number | null };
    team_hours_saved: { per_quarter: number | null; estimate: boolean };
  };
  periods: Record<string, { label: string }>;
  simulated: boolean;
};

export type YearCounts = { debris_episodes: number; recurrences: number; flood_events: number };
export type YearRow = {
  year: number;
  partial: boolean;
  full_year: YearCounts;
  jan_to_ref: YearCounts;
  jul_to_ref: YearCounts;
};
export type YearlyResponse = { as_of: string | null; system_start: string | null; years: YearRow[] };

export type Scenario = { without_action: number; with_plan: number; change_pct?: number | null };
export type MonthProjection = {
  month: string;
  label: string;
  debris_episodes: Scenario;
  recurrences: Scenario;
  flood_events: Scenario;
  seasonal_events: string[];
};
export type Next3Months = {
  baseline: string;
  months: MonthProjection[];
  totals: Record<"debris_episodes" | "recurrences" | "flood_events", Scenario>;
  team_hours_saved: number | null;
};

export type SeasonalEvent = {
  key: string;
  name: string;
  start: string;
  end: string;
  description: string;
  modules: ("residuos" | "alagamentos")[];
  active: boolean;
  days_until: number;
};
export type SeasonalCalendar = { reference_date: string; events: SeasonalEvent[] };

export type Material = "poster" | "social" | "door_to_door" | "action_plan";
export type Audience = "moradores" | "comerciantes" | "escolas" | "geral";
export type Tone = "amigavel" | "informativo" | "direto";

export type GeneratedText = {
  title: string;
  text: string;
  mode: "api" | "fallback";
  badge: string;
  generated_at: string;
};
export type AwarenessResult = GeneratedText & { point_id: string; material: Material; variant: number };

export type DecisionIn = {
  recommendation: string;
  decision: "aceita" | "adiada" | "rejeitada";
  intervention?: string | null;
  planned_date?: string | null;
  notes?: string | null;
};
export type Decision = DecisionIn & { id: string; point_id: string; created_at: string };
