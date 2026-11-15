"use client";

import { formatDateTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { AuditResponse, ErrorLogLine, SystemHealth } from "@/lib/types";
import { ErrorState, LoadingBlock } from "@/components/States";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

const LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] as const;

function ErrorTable({ caption, rows }: { caption: string; rows: ErrorLogLine[] }) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-muted">Nenhum registro desde o último cold start.</p>;
  }
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border text-muted">
          <tr>
            <th scope="col" className="py-2 pr-3 font-semibold">Quando</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Nível</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Mensagem</th>
            <th scope="col" className="py-2 font-semibold">Request ID</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.time}-${i}`} className="border-b border-border align-top last:border-0">
              <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(r.time)}</td>
              <td className="py-2 pr-3 font-semibold">{r.level}</td>
              <td className="py-2 pr-3 break-words">{r.message}</td>
              <td className="py-2 font-mono text-xs break-all">{r.request_id ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Uptime, modo do LLM, erros e trilha de auditoria (só Administrador). */
export function SystemSections() {
  const health = useApi<SystemHealth>("/api/admin/system-health");
  const audit = useApi<AuditResponse>("/api/admin/audit");

  return (
    <>
      <section aria-labelledby="sistema" className="card p-5">
        <h2 id="sistema" className="font-display text-xl font-semibold">
          Execução e IA
        </h2>
        {health.loading && <LoadingBlock className="mt-3 h-32" label="Carregando…" />}
        {health.error && (
          <div className="mt-3">
            <ErrorState error={health.error} onRetry={health.reload} />
          </div>
        )}
        {health.data && (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Versão</dt>
            <dd>{health.data.version}</dd>
            <dt className="text-muted">No ar desde</dt>
            <dd>{formatDateTime(health.data.started_at)}</dd>
            <dt className="text-muted">Uptime</dt>
            <dd>{formatUptime(health.data.uptime_seconds)}</dd>
            <dt className="text-muted">Dados gerados em</dt>
            <dd>{formatDateTime(health.data.data_generated_at)}</dd>
            <dt className="text-muted">Modo do LLM</dt>
            <dd className="font-semibold">
              {health.data.llm_mode === "api"
                ? `● API (${health.data.llm_model})`
                : "▲ Fallback (textos prontos, sem chave de API)"}
            </dd>
            <dt className="text-muted">Sentry</dt>
            <dd>{health.data.sentry_enabled ? "Ativado" : "Desativado"}</dd>
          </dl>
        )}
        {health.data && (
          <p className="mt-3 text-xs text-muted">{health.data.memory_store_notice}</p>
        )}
      </section>

      {health.data && (
        <section aria-labelledby="erros" className="card p-5">
          <h2 id="erros" className="font-display text-xl font-semibold">
            Erros e avisos
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Contagem por nível de log">
            {LEVELS.map((level) => (
              <li key={level} className="rounded-full border border-border bg-surface-2 px-3 py-1">
                {level}: <strong>{health.data?.error_counts[level] ?? 0}</strong>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 font-semibold">Últimos erros da API (até 20)</h3>
          <ErrorTable caption="Últimos erros da API" rows={health.data.recent_errors} />
          <h3 className="mt-4 font-semibold">Últimos erros do navegador (até 20)</h3>
          <ErrorTable caption="Últimos erros do navegador" rows={health.data.recent_client_errors} />
        </section>
      )}

      <section aria-labelledby="auditoria" className="card p-5">
        <h2 id="auditoria" className="font-display text-xl font-semibold">
          Trilha de auditoria
        </h2>
        <p className="mt-1 text-sm text-muted">
          Quem entrou, exportou ou apagou dados pessoais. Só o código do usuário é guardado
          {audit.data ? `, por ${Math.round(audit.data.retention_days / 30)} meses` : ""}.
        </p>
        {audit.loading && <LoadingBlock className="mt-3 h-24" label="Carregando…" />}
        {audit.error && (
          <div className="mt-3">
            <ErrorState error={audit.error} onRetry={audit.reload} />
          </div>
        )}
        {audit.data && audit.data.items.length === 0 && (
          <p className="mt-3 text-sm text-muted">Sem registros.</p>
        )}
        {audit.data && audit.data.items.length > 0 && (
          <div className="mt-3 max-h-80 overflow-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">Registros recentes da trilha de auditoria</caption>
              <thead className="border-b border-border text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-semibold">Quando</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Ação</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Usuário</th>
                  <th scope="col" className="py-2 font-semibold">Request ID</th>
                </tr>
              </thead>
              <tbody>
                {audit.data.items.map((e, i) => (
                  <tr key={`${e.time}-${i}`} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(e.time)}</td>
                    <td className="py-2 pr-3">{e.action.replaceAll("_", " ")}</td>
                    <td className="py-2 pr-3">
                      {e.user_id ?? "—"} {e.role ? `(${e.role})` : ""}
                    </td>
                    <td className="py-2 font-mono text-xs break-all">{e.request_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
