"use client";

import { useMemo, useState } from "react";
import { useApi } from "@/lib/useApi";
import { ALERT_TYPE_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/format";
import type { Alert, Page } from "@/lib/types";
import { AlertCard } from "@/components/AlertList";
import { EmptyState, ErrorState, LoadingBlock, StaleNotice } from "@/components/States";

export function AlertsView() {
  const { data, error, loading, stale, reload } = useApi<Page<Alert>>("/api/alerts?page_size=200");
  const [severity, setSeverity] = useState<string>("todos");
  const [type, setType] = useState<string>("todos");

  const items = useMemo(() => data?.items ?? [], [data]);
  const bySeverity = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((a) => (c[a.severity] = (c[a.severity] ?? 0) + 1));
    return c;
  }, [items]);
  const types = useMemo(() => Array.from(new Set(items.map((a) => a.type))), [items]);

  const filtered = items.filter(
    (a) => (severity === "todos" || a.severity === severity) && (type === "todos" || a.type === type),
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <header>
        <h1 className="font-display text-3xl font-bold">Alertas e monitoramento</h1>
        <p className="mt-1 max-w-3xl text-muted">
          Situações que pedem atenção, da mais urgente para a menos urgente. Os alertas são gerados
          pelos modelos estatísticos a partir de chuva, histórico, bocas de lobo e reincidência.
        </p>
      </header>

      {stale && <StaleNotice />}

      <section aria-labelledby="filtro-alertas" className="card flex flex-col gap-4 p-4">
        <h2 id="filtro-alertas" className="sr-only">
          Filtrar alertas
        </h2>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-muted">Gravidade</legend>
          <div className="flex flex-wrap gap-2">
            {["todos", ...SEVERITY_ORDER].map((s) => {
              const count = s === "todos" ? items.length : (bySeverity[s] ?? 0);
              return (
                <label
                  key={s}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-primary"
                >
                  <input
                    type="radio"
                    name="gravidade"
                    className="sr-only"
                    checked={severity === s}
                    onChange={() => setSeverity(s)}
                  />
                  {s === "todos" ? "Todas" : SEVERITY_LABEL[s]}
                  <span className="text-xs font-normal text-muted">{count}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <label htmlFor="tipo-alerta" className="text-sm font-semibold text-muted">
            Tipo de alerta
          </label>
          <select
            id="tipo-alerta"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="min-h-11 rounded-lg border border-border bg-background px-3"
          >
            <option value="todos">Todos os tipos</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {ALERT_TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="lista-alertas" aria-live="polite">
        <h2 id="lista-alertas" className="mb-3 font-display text-lg font-semibold">
          {filtered.length} alerta(s)
        </h2>
        {loading && <LoadingBlock label="Carregando alertas…" className="h-64" />}
        {error && <ErrorState title="Alertas indisponíveis" error={error} onRetry={reload} />}
        {data && filtered.length === 0 && (
          <EmptyState title="Nenhum alerta com esses filtros">Tente outra gravidade ou tipo.</EmptyState>
        )}
        {filtered.length > 0 && (
          <ul className="flex flex-col gap-3">
            {filtered.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
