import type { Horizon, RiskLevel, Role, Severity } from "@/lib/types";

export const RISK_LABEL: Record<RiskLevel, string> = {
  baixo: "Baixa",
  médio: "Média",
  alto: "Alta",
};

/** Classe CSS dos marcadores/halos (sem acento). */
export const RISK_CLASS: Record<RiskLevel, "baixo" | "medio" | "alto"> = {
  baixo: "baixo",
  médio: "medio",
  alto: "alto",
};

export const SEVERITY_LABEL: Record<string, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  info: "Informativo",
};

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "info"];

export const ALERT_TYPE_LABEL: Record<string, string> = {
  flood_high_risk: "Alagamento",
  chronic_recurrence: "Reincidente crônico",
  awareness: "Conscientização",
  debris_forecast: "Entulho previsto",
  seasonal_event: "Evento sazonal",
};

export const HORIZON_LABEL: Record<Horizon, string> = {
  now: "Agora",
  "24h": "+24 h",
  "72h": "+72 h",
  "3m": "+3 meses",
};

export const WASTE_LABEL: Record<string, string> = {
  entulho: "Entulho",
  volumosos: "Volumosos",
  domestico: "Doméstico",
  poda: "Poda",
  misto: "Misto",
  pneus: "Pneus",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  tecnico: "Técnico de campo",
  defesa_civil: "Defesa Civil",
};

/** "Atualizado às HH:MM" a partir do horário de geração dos dados. */
export function formatUpdatedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR");
}
