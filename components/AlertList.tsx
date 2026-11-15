import Link from "next/link";
import type { Alert } from "@/lib/types";
import { ALERT_TYPE_LABEL, HORIZON_LABEL, SEVERITY_LABEL } from "@/lib/format";
import type { Horizon } from "@/lib/types";
import { IconMap } from "@/components/icons";

const SEVERITY_STYLE: Record<string, { box: string; mark: string }> = {
  critical: { box: "border-l-critical", mark: "▲▲" },
  high: { box: "border-l-risk-high", mark: "▲" },
  medium: { box: "border-l-risk-mid", mark: "◆" },
  info: { box: "border-l-primary", mark: "●" },
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: "text-critical",
  high: "text-risk-high",
  medium: "text-risk-mid",
  info: "text-primary",
};

export function focusKeyOf(alert: Alert): string | null {
  return alert.flood_area_id ?? alert.point_id ?? null;
}

export function SeverityTag({ severity }: { severity: string }) {
  const style = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.info;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${SEVERITY_TEXT[severity] ?? ""}`}>
      <span aria-hidden="true">{style.mark}</span>
      {SEVERITY_LABEL[severity] ?? severity}
    </span>
  );
}

export function AlertCard({
  alert,
  onFocus,
  mapHref = "/mapa",
}: {
  alert: Alert;
  /** Quando informado, "Ver no mapa" centraliza o mapa atual; senão leva à tela do mapa. */
  onFocus?: (alert: Alert) => void;
  mapHref?: string;
}) {
  const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.info;
  const key = focusKeyOf(alert);
  const horizon = alert.horizon ? HORIZON_LABEL[alert.horizon as Horizon] : null;
  return (
    <li className={`card border-l-[6px] p-3.5 ${style.box}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SeverityTag severity={alert.severity} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {ALERT_TYPE_LABEL[alert.type] ?? alert.type}
        </span>
        {alert.score !== null && (
          <span className="text-xs font-semibold text-muted">
            Risco {alert.score}/100{horizon ? ` · ${horizon}` : ""}
          </span>
        )}
      </div>
      <h3 className="mt-1 font-display text-base font-semibold leading-snug">{alert.title}</h3>
      <p className="mt-1 text-sm text-muted">{alert.message}</p>
      {alert.suggestions && alert.suggestions.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-sm">
          {alert.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
      {alert.starts_on && alert.ends_on && (
        <p className="mt-1 text-xs text-muted">
          Período: {new Date(`${alert.starts_on}T12:00:00`).toLocaleDateString("pt-BR")} a{" "}
          {new Date(`${alert.ends_on}T12:00:00`).toLocaleDateString("pt-BR")}
        </p>
      )}
      {(key || alert.point_id) && (
        <div className="mt-2 flex flex-wrap gap-x-4">
          {key &&
            (onFocus ? (
              <button
                type="button"
                onClick={() => onFocus(alert)}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline"
              >
                <IconMap size={16} />
                Ver no mapa
              </button>
            ) : (
              <Link
                href={`${mapHref}?foco=${encodeURIComponent(key)}`}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary underline"
              >
                <IconMap size={16} />
                Ver no mapa
              </Link>
            ))}
          {alert.point_id && (
            <Link
              href={`/pontos/${alert.point_id}`}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline"
            >
              Ver ponto {alert.point_id}
            </Link>
          )}
        </div>
      )}
    </li>
  );
}
