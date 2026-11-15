/** Tipos dos contratos da API (espelham backend/models/schemas.py). */

export type Role = "admin" | "gestor" | "tecnico" | "defesa_civil";
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

export type SessionResponse = { user: User; expires_at: string | null };

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
  simulated: boolean;
};
