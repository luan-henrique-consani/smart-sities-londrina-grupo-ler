"use client";

import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { formatDateTime } from "@/lib/format";
import type { Meta } from "@/lib/types";
import { HealthStatus } from "@/components/HealthStatus";
import { ErrorState, LoadingBlock } from "@/components/States";

const COUNT_LABEL: Record<string, string> = {
  areas: "Bairros/áreas",
  points: "Pontos de descarte",
  episodes: "Episódios",
  cleanings: "Limpezas",
  flood_areas: "Áreas de alagamento",
  drains: "Bocas de lobo",
  flood_events: "Eventos de alagamento",
  alerts: "Alertas",
};

export function HealthView() {
  const { user } = useAuth();
  const meta = useApi<Meta>("/api/meta");

  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="Acesso restrito"
          error={new Error("A tela Saúde do sistema é exclusiva do perfil Administrador.")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="font-display text-3xl font-bold">Saúde do sistema</h1>
        <p className="mt-1 text-muted">
          Estado da API e dos dados carregados. Visível apenas para o Administrador.
        </p>
      </header>

      <HealthStatus />

      <section aria-labelledby="dados-carregados" className="card p-5">
        <h2 id="dados-carregados" className="font-display text-xl font-semibold">
          Dados carregados
        </h2>
        {meta.loading && <LoadingBlock className="mt-3 h-32" label="Carregando…" />}
        {meta.error && <div className="mt-3"><ErrorState error={meta.error} onRetry={meta.reload} /></div>}
        {meta.data && (
          <>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Versão da API</dt>
              <dd>{meta.data.version}</dd>
              <dt className="text-muted">Dados gerados em</dt>
              <dd>{formatDateTime(meta.data.generated_at)}</dd>
              <dt className="text-muted">Data de referência</dt>
              <dd>{meta.data.reference_date ?? "—"}</dd>
              <dt className="text-muted">Início das previsões</dt>
              <dd>{meta.data.system_start ?? "—"}</dd>
              <dt className="text-muted">Estado dos arquivos</dt>
              <dd className={meta.data.degraded ? "font-semibold text-critical" : "font-semibold text-primary"}>
                {meta.data.degraded ? "▲ Degradado (seed embutido em uso)" : "● Tudo carregado"}
              </dd>
            </dl>
            <table className="mt-4 w-full text-left text-sm">
              <caption className="sr-only">Quantidade de registros por conjunto de dados.</caption>
              <thead className="border-b border-border text-muted">
                <tr>
                  <th scope="col" className="py-2 font-semibold">Conjunto</th>
                  <th scope="col" className="py-2 text-right font-semibold">Registros</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(meta.data.counts).map(([key, value]) => (
                  <tr key={key} className="border-b border-border last:border-0">
                    <td className="py-2">{COUNT_LABEL[key] ?? key}</td>
                    <td className="py-2 text-right">{value.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        <p className="mt-4 text-sm text-muted">
          Uptime, modo do LLM (API/fallback) e últimos erros serão exibidos aqui na fase de
          observabilidade.
        </p>
      </section>
    </div>
  );
}
