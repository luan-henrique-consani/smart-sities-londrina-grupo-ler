"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DecisionDialog } from "@/components/DecisionDialog";
import { useApi } from "@/lib/useApi";
import { WASTE_LABEL, formatDate, formatDateTime } from "@/lib/format";
import type { AccumulationForecast, Decision, PointSummary, RiskLevel } from "@/lib/types";
import { CategoryTag, RiskBadge } from "@/components/Shapes";
import { ErrorState, LoadingBlock } from "@/components/States";
import { IconMap } from "@/components/icons";

type PointDetail = PointSummary & {
  hour_pattern: { label: string; share: number; detected: boolean } | null;
  recurrence: { chronic: boolean; episodes_in_window: number; window_days: number; min_episodes: number; message: string; suggestions: string[] };
  stats: {
    mean_interval_days: number | null;
    city_mean_interval_days: number | null;
    team_hours_last_30d: number;
    cleanings_last_30d: number;
    episodes_total: number;
  };
  linked_flood_area: { id: string; name: string; distance_m: number; score_72h: number; level_72h: RiskLevel } | null;
  episodes: { id: string; start: string; end: string; reports: number }[];
  decisions: Decision[];
};

const DECISION_LABEL: Record<string, string> = { aceita: "Aceita", adiada: "Adiada", rejeitada: "Rejeitada" };

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function forecastText(next: AccumulationForecast | null) {
  return next ? next.label : "Sem previsão";
}

export function PointView() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi<PointDetail>(`/api/points/${encodeURIComponent(id)}`);
  const { user } = useAuth();
  const [dialog, setDialog] = useState(false);
  const [saved, setSaved] = useState<Decision[]>([]);
  const canDecide = user?.role === "admin" || user?.role === "gestor" || user?.role === "tecnico";
  const canGenerate = user?.role === "admin" || user?.role === "gestor";
  const decisions = [...saved, ...(data?.decisions ?? []).filter((d) => !saved.some((s) => s.id === d.id))];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <nav aria-label="Trilha de navegação" className="text-sm">
        <Link href="/mapa" className="inline-flex min-h-11 items-center text-primary underline">
          ← Voltar ao mapa e alertas
        </Link>
      </nav>

      {loading && <LoadingBlock label="Carregando o ponto…" className="h-64" />}
      {error && (
        <ErrorState
          title={error.kind === "not_found" ? "Ponto não encontrado" : "Não foi possível carregar o ponto"}
          error={error}
          onRetry={error.kind === "not_found" ? undefined : reload}
        />
      )}

      {data && (
        <>
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <CategoryTag category={data.chronic ? "reincidente" : "entulho"} />
              <RiskBadge level={data.risk} />
            </div>
            <h1 className="font-display text-3xl font-bold">
              Ponto {data.id} · {data.area_name}
            </h1>
            <p className="text-muted">
              {WASTE_LABEL[data.waste_type] ?? data.waste_type} · dados simulados · coordenadas aproximadas.
            </p>
            <Link
              href={`/mapa?foco=${data.id}`}
              className="inline-flex min-h-11 w-fit items-center gap-1.5 font-semibold text-primary underline"
            >
              <IconMap size={16} /> Ver no mapa
            </Link>
          </header>

          <section aria-labelledby="resumo-ponto">
            <h2 id="resumo-ponto" className="sr-only">Resumo do ponto</h2>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Próximo acúmulo previsto"
                value={forecastText(data.next)}
                hint={data.next ? `Confiança ${data.next.confidence}` : undefined}
              />
              <Stat
                label="Intervalo médio de retorno"
                value={data.stats.mean_interval_days ? `${data.stats.mean_interval_days.toLocaleString("pt-BR")} dias` : "—"}
                hint={
                  data.stats.city_mean_interval_days
                    ? `Média da cidade: ${data.stats.city_mean_interval_days.toLocaleString("pt-BR")} dias`
                    : undefined
                }
              />
              <Stat
                label="Episódios em 15 dias"
                value={String(data.episodes_last_15d)}
                hint={`${data.stats.episodes_total} no histórico`}
              />
              <Stat
                label="Equipe nos últimos 30 dias"
                value={`${data.stats.team_hours_last_30d.toLocaleString("pt-BR")} h`}
                hint={`${data.stats.cleanings_last_30d} limpeza(s)`}
              />
            </dl>
          </section>

          <section
            aria-labelledby="reincidencia"
            className={`card p-4 ${data.recurrence.chronic ? "border-2 border-critical" : ""}`}
          >
            <h2 id="reincidencia" className="font-display text-lg font-semibold">
              {data.recurrence.chronic ? "Limpeza sozinha não resolve" : "Reincidência"}
            </h2>
            <p className="mt-1">{data.recurrence.message}</p>
            {data.recurrence.suggestions.length > 0 && (
              <>
                <p className="mt-3 text-sm font-semibold text-muted">Ações sugeridas além da limpeza</p>
                <ul className="mt-1 list-disc pl-5">
                  {data.recurrence.suggestions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {data.hour_pattern?.detected && (
              <p className="mt-3 text-sm">
                Horário mais frequente: <strong>{data.hour_pattern.label}</strong> (
                {Math.round(data.hour_pattern.share * 100)}% dos episódios).
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {canDecide && (
                <button
                  type="button"
                  onClick={() => setDialog(true)}
                  className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary"
                >
                  Registrar decisão
                </button>
              )}
              {canGenerate && (
                <Link
                  href={`/conscientizacao?ponto=${data.id}`}
                  className="inline-flex min-h-11 items-center rounded-lg border-2 border-primary px-4 font-semibold text-primary"
                >
                  Gerar materiais de conscientização
                </Link>
              )}
            </div>
          </section>

          {data.linked_flood_area && (
            <section aria-labelledby="alag-ligado" className="card p-4">
              <h2 id="alag-ligado" className="font-display text-lg font-semibold">Risco de alagamento ligado</h2>
              <p className="mt-1">
                A {data.linked_flood_area.distance_m} m fica a área{" "}
                <Link href={`/mapa?foco=${data.linked_flood_area.id}`} className="font-semibold text-primary underline">
                  {data.linked_flood_area.name}
                </Link>
                : risco {data.linked_flood_area.score_72h}/100 em 72 h.
              </p>
            </section>
          )}

          <section aria-labelledby="episodios" className="card overflow-x-auto">
            <h2 id="episodios" className="px-4 pt-4 font-display text-lg font-semibold">
              Linha do tempo de episódios
            </h2>
            <table className="mt-2 w-full min-w-[24rem] text-left text-sm">
              <caption className="sr-only">Últimos episódios de descarte neste ponto (relatos agrupados em 150 m e 48 h).</caption>
              <thead className="border-y border-border text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">Início</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Fim</th>
                  <th scope="col" className="px-4 py-2 font-semibold">Relatos agrupados</th>
                </tr>
              </thead>
              <tbody>
                {data.episodes.slice(0, 15).map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{formatDateTime(e.start)}</td>
                    <td className="px-4 py-2">{formatDate(e.end)}</td>
                    <td className="px-4 py-2">{e.reports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="decisoes" className="card p-4">
            <h2 id="decisoes" className="font-display text-lg font-semibold">Decisões registradas</h2>
            {decisions.length === 0 ? (
              <p className="mt-1 text-muted">Nenhuma decisão registrada neste ponto ainda.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {decisions.map((d) => (
                  <li key={d.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-semibold">
                      {DECISION_LABEL[d.decision] ?? d.decision}
                      {d.intervention ? ` · ${d.intervention.replaceAll("_", " ")}` : ""}
                    </p>
                    <p>{d.recommendation}</p>
                    <p className="text-muted">
                      {formatDateTime(d.created_at)}
                      {d.planned_date ? ` · previsto para ${formatDate(d.planned_date)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DecisionDialog
            pointId={data.id}
            open={dialog}
            suggestions={data.recurrence.suggestions}
            onClose={() => setDialog(false)}
            onSaved={(d) => setSaved((cur) => [d, ...cur])}
          />
        </>
      )}
    </div>
  );
}
