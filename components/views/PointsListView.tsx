"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { WASTE_LABEL, formatDate } from "@/lib/format";
import type { Page, PointSummary } from "@/lib/types";
import { CategoryTag, RiskBadge } from "@/components/Shapes";
import { EmptyState, ErrorState, LoadingBlock, StaleNotice } from "@/components/States";

type Sort = "risk" | "next" | "episodes" | "id";

const SELECT =
  "min-h-11 rounded-lg border border-border bg-surface px-3 text-foreground";

export function PointsListView() {
  const [chronic, setChronic] = useState(true);
  const [risk, setRisk] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<Sort>("risk");

  const qs = new URLSearchParams({ page_size: "100", sort });
  if (chronic) qs.set("chronic", "true");
  if (risk) qs.set("risk", risk);
  if (type) qs.set("type", type);
  const { data, error, loading, reload, stale } = useApi<Page<PointSummary>>(
    `/api/points?${qs.toString()}`,
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold">Pontos reincidentes</h1>
        <p className="max-w-3xl text-muted">
          Pontos onde o lixo volta. Reincidente crônico é o ponto com 3 ou mais episódios em 15
          dias: nele, limpar sozinho não resolve. Dados simulados e coordenadas aproximadas.
        </p>
      </header>

      <form
        className="card flex flex-wrap items-end gap-3 p-4"
        aria-label="Filtros da lista de pontos"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex min-h-11 items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={chronic}
            onChange={(e) => setChronic(e.target.checked)}
            className="h-5 w-5 accent-[var(--primary)]"
          />
          Só reincidentes crônicos
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Criticidade
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className={SELECT}>
            <option value="">Todas</option>
            <option value="alto">Alta</option>
            <option value="médio">Média</option>
            <option value="baixo">Baixa</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Tipo de resíduo
          <select value={type} onChange={(e) => setType(e.target.value)} className={SELECT}>
            <option value="">Todos</option>
            {Object.entries(WASTE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Ordenar por
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={SELECT}>
            <option value="risk">Criticidade</option>
            <option value="next">Próximo acúmulo</option>
            <option value="episodes">Nº de episódios</option>
            <option value="id">Código</option>
          </select>
        </label>
      </form>

      {stale && <StaleNotice />}
      {loading && <LoadingBlock label="Carregando os pontos…" className="h-64" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <section aria-labelledby="res-pontos" aria-live="polite">
          <h2 id="res-pontos" className="mb-2 font-display text-lg font-semibold">
            {data.total} {data.total === 1 ? "ponto encontrado" : "pontos encontrados"}
            {data.total > data.items.length && ` (mostrando ${data.items.length})`}
          </h2>
          {data.items.length === 0 ? (
            <EmptyState title="Nenhum ponto com esses filtros">
              Tente remover algum filtro.
            </EmptyState>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <caption className="sr-only">
                  Pontos de descarte com criticidade, previsão do próximo acúmulo e episódios.
                </caption>
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Ponto</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Situação</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Próximo acúmulo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Episódios em 15 dias</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Último episódio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <th scope="row" className="px-4 py-3 font-medium">
                        <Link
                          href={`/pontos/${p.id}`}
                          className="inline-flex min-h-11 flex-col justify-center text-primary underline"
                        >
                          <span>{p.id}</span>
                          <span className="font-normal text-foreground no-underline">
                            {p.area_name} · {WASTE_LABEL[p.waste_type] ?? p.waste_type}
                          </span>
                        </Link>
                      </th>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <CategoryTag category={p.chronic ? "reincidente" : "entulho"} />
                          <RiskBadge level={p.risk} />
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.next ? p.next.label : "Sem previsão"}</td>
                      <td className="px-4 py-3">{p.episodes_last_15d}</td>
                      <td className="px-4 py-3">{formatDate(p.last_episode)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
