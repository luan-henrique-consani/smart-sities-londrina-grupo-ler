"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import {
  HORIZON_LABEL,
  RISK_LABEL,
  WASTE_LABEL,
  formatDate,
} from "@/lib/format";
import type {
  Alert,
  FloodAreasResponse,
  Horizon,
  Page,
  PointSummary,
  RiskLevel,
} from "@/lib/types";
import {
  CATEGORY_LABEL,
  CATEGORY_SHAPE_LABEL,
  CategoryTag,
  RiskBadge,
  ShapeIcon,
  type Category,
} from "@/components/Shapes";
import { AlertCard, focusKeyOf } from "@/components/AlertList";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState, ErrorState, LoadingBlock, StaleNotice } from "@/components/States";
import { IconAlert, IconList, IconMap } from "@/components/icons";
import type { FocusRequest, MapItem } from "./mapTypes";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <LoadingBlock label="Carregando o mapa…" className="h-full min-h-[22rem]" />,
});

const CATEGORIES: Category[] = ["alagamento", "entulho", "reincidente"];
const LEVELS: RiskLevel[] = ["alto", "médio", "baixo"];
const HORIZONS: Horizon[] = ["now", "24h", "72h", "3m"];
const LIST_PAGE = 60;

const LEVEL_ORDER: Record<RiskLevel, number> = { alto: 0, médio: 1, baixo: 2 };

function floodToItem(area: FloodAreasResponse["items"][number], horizon: Horizon): MapItem {
  return {
    key: area.id,
    category: "alagamento",
    level: area.level,
    lat: area.lat,
    lon: area.lon,
    radius: area.radius_m,
    approximate: area.approximate,
    title: area.name,
    subtitle: `Área de alagamento · risco ${area.score}/100 (${HORIZON_LABEL[horizon]})`,
    details: [
      `Bocas de lobo entupidas: ${area.factors.clogged_drains} de ${area.factors.total_drains}`,
      `Pontos de lixo por perto: ${area.factors.waste_points_nearby}`,
      `Alagamentos por ano (histórico): ${area.factors.events_per_year.toLocaleString("pt-BR")}`,
    ],
  };
}

function pointToItem(p: PointSummary): MapItem {
  return {
    key: p.id,
    category: p.chronic ? "reincidente" : "entulho",
    level: p.risk,
    lat: p.lat,
    lon: p.lon,
    approximate: p.approximate,
    href: `/pontos/${p.id}`,
    title: `${WASTE_LABEL[p.waste_type] ?? p.waste_type} · ${p.area_name}`,
    subtitle: p.chronic ? `Reincidente crônico · ponto ${p.id}` : `Ponto de descarte ${p.id}`,
    details: [
      p.next ? `Próximo acúmulo previsto: ${p.next.label}` : "Previsão indisponível (poucos episódios)",
      `Episódios nos últimos 15 dias: ${p.episodes_last_15d}`,
      `Último episódio: ${formatDate(p.last_episode)}`,
      p.pending_cleaning ? "Limpeza pendente" : "Sem limpeza pendente",
    ],
  };
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--primary)]"
      />
      {children}
    </label>
  );
}

export function MapPanel() {
  const params = useSearchParams();
  const [horizon, setHorizon] = useState<Horizon>("72h");
  const [categories, setCategories] = useState<Set<Category>>(new Set(CATEGORIES));
  const [levels, setLevels] = useState<Set<RiskLevel>>(
    new Set(params.get("foco") ? LEVELS : ["alto", "médio"]),
  );
  const [view, setView] = useState<"mapa" | "lista">("mapa");
  const [tilesFailed, setTilesFailed] = useState(false);
  const [listLimit, setListLimit] = useState(LIST_PAGE);
  const [focus, setFocus] = useState<FocusRequest | null>(() => {
    const key = params.get("foco");
    return key ? { key, nonce: 1 } : null;
  });
  const mapRef = useRef<HTMLDivElement>(null);

  const floods = useApi<FloodAreasResponse>(`/api/flood-areas?horizon=${horizon}`);
  const points = useApi<Page<PointSummary>>("/api/points?page_size=500");
  const alerts = useApi<Page<Alert>>("/api/alerts?page_size=200");

  const allItems = useMemo<MapItem[]>(
    () => [
      ...(floods.data?.items.map((a) => floodToItem(a, horizon)) ?? []),
      ...(points.data?.items.map(pointToItem) ?? []),
    ],
    [floods.data, points.data, horizon],
  );

  const visible = useMemo(
    () => allItems.filter((i) => categories.has(i.category) && levels.has(i.level)),
    [allItems, categories, levels],
  );

  const counts = useMemo(() => {
    const byCategory: Record<Category, number> = { alagamento: 0, entulho: 0, reincidente: 0 };
    const byLevel: Record<RiskLevel, number> = { alto: 0, médio: 0, baixo: 0 };
    for (const i of allItems) {
      if (levels.has(i.level)) byCategory[i.category] += 1;
      if (categories.has(i.category)) byLevel[i.level] += 1;
    }
    return { byCategory, byLevel };
  }, [allItems, categories, levels]);

  const sortedList = useMemo(
    () =>
      [...visible].sort(
        (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.title.localeCompare(b.title, "pt-BR"),
      ),
    [visible],
  );

  function toggle<T>(set: Set<T>, value: T, on: boolean): Set<T> {
    const next = new Set(set);
    if (on) next.add(value);
    else next.delete(value);
    return next;
  }

  /** Centraliza o mapa em um item, garantindo que ele passe pelos filtros. */
  function focusItem(key: string) {
    const item = allItems.find((i) => i.key === key);
    if (item) {
      setCategories((c) => (c.has(item.category) ? c : new Set(c).add(item.category)));
      setLevels((l) => (l.has(item.level) ? l : new Set(l).add(item.level)));
    }
    setView("mapa");
    setFocus((prev) => ({ key, nonce: (prev?.nonce ?? 0) + 1 }));
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const loadingData = floods.loading || points.loading;
  const rain = floods.data?.rain;
  const hiddenLow = !levels.has("baixo") ? counts.byLevel.baixo : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="flex min-w-0 flex-col gap-4">
        {(floods.stale || points.stale) && <StaleNotice />}

        {/* Filtros */}
        <section aria-labelledby="filtros-titulo" className="card flex flex-col gap-4 p-4">
          <h2 id="filtros-titulo" className="font-display text-lg font-semibold">
            Filtros do mapa
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-muted">Categoria</legend>
              {CATEGORIES.map((c) => (
                <Toggle
                  key={c}
                  checked={categories.has(c)}
                  onChange={(on) => setCategories((s) => toggle(s, c, on))}
                >
                  <ShapeIcon
                    category={c}
                    color={c === "alagamento" ? "var(--flood)" : c === "entulho" ? "var(--debris)" : "var(--critical)"}
                  />
                  <span className="flex-1">{CATEGORY_LABEL[c]}</span>
                  <span className="text-xs text-muted">{counts.byCategory[c]}</span>
                </Toggle>
              ))}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-muted">Criticidade</legend>
              {LEVELS.map((l) => (
                <Toggle
                  key={l}
                  checked={levels.has(l)}
                  onChange={(on) => setLevels((s) => toggle(s, l, on))}
                >
                  <span className="flex-1">{RISK_LABEL[l]}</span>
                  <span className="text-xs text-muted">{counts.byLevel[l]}</span>
                </Toggle>
              ))}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-muted">
                Horizonte do risco de alagamento
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {HORIZONS.map((h) => (
                  <label
                    key={h}
                    className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-2 text-sm font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-primary"
                  >
                    <input
                      type="radio"
                      name="horizonte"
                      value={h}
                      checked={horizon === h}
                      onChange={() => setHorizon(h)}
                      className="sr-only"
                    />
                    {HORIZON_LABEL[h]}
                  </label>
                ))}
              </div>
              {rain && (
                <p className="text-xs text-muted" aria-live="polite">
                  Chuva prevista: {rain.rain_3h_mm.toLocaleString("pt-BR")} mm em 3 h ·{" "}
                  {rain.rain_24h_mm.toLocaleString("pt-BR")} mm em 24 h.
                </p>
              )}
            </fieldset>
          </div>
          {hiddenLow > 0 && (
            <p className="text-sm text-muted">
              {hiddenLow} item(ns) de criticidade baixa estão ocultos para destacar o que exige ação.
            </p>
          )}
        </section>

        {/* Mapa ou lista */}
        <section aria-labelledby="mapa-titulo" ref={mapRef} className="scroll-mt-20">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="mapa-titulo" className="font-display text-lg font-semibold">
              Londrina: pontos e áreas de risco
              <span className="ml-2 text-sm font-normal text-muted">({visible.length} no filtro)</span>
            </h2>
            <div role="group" aria-label="Forma de visualização" className="flex gap-2">
              {(
                [
                  ["mapa", "Mapa", IconMap],
                  ["lista", "Lista", IconList],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                    view === id
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface hover:bg-surface-2"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tilesFailed && (
            <p
              role="alert"
              className="mb-2 flex items-start gap-2 rounded-lg border-2 border-debris bg-surface px-3 py-2 text-sm font-medium text-debris"
            >
              <IconAlert size={18} className="mt-0.5 shrink-0" />
              Não foi possível carregar o mapa base (OpenStreetMap). Os dados continuam disponíveis na
              visão em lista.
            </p>
          )}

          {floods.error && <ErrorState title="Áreas de alagamento indisponíveis" error={floods.error} onRetry={floods.reload} />}
          {points.error && <ErrorState title="Pontos de descarte indisponíveis" error={points.error} onRetry={points.reload} />}

          {view === "mapa" ? (
            <div
              role="region"
              aria-label="Mapa interativo de Londrina. Use Tab para percorrer os marcadores e Enter para abrir os detalhes. A visão em lista traz as mesmas informações."
              className="card relative h-[62vh] min-h-[22rem] overflow-hidden"
            >
              {loadingData ? (
                <LoadingBlock label="Carregando o mapa…" className="h-full min-h-[22rem]" />
              ) : (
                <ErrorBoundary component="MapView">
                  <MapView items={visible} focus={focus} onTilesFailed={() => { setTilesFailed(true); setView("lista"); }} />
                </ErrorBoundary>
              )}
            </div>
          ) : loadingData ? (
            <LoadingBlock label="Carregando a lista…" className="h-64" />
          ) : sortedList.length === 0 ? (
            <EmptyState title="Nenhum item com esses filtros">
              Ative outras categorias ou níveis de criticidade.
            </EmptyState>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="sr-only">
                  Pontos de descarte e áreas de alagamento do filtro atual, da criticidade mais alta
                  para a mais baixa.
                </caption>
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Categoria</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Local</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Criticidade</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Detalhe</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedList.slice(0, listLimit).map((item) => (
                    <tr key={item.key} className="border-b border-border last:border-0 align-top">
                      <td className="px-3 py-2.5"><CategoryTag category={item.category} /></td>
                      <td className="px-3 py-2.5 font-medium">{item.title}</td>
                      <td className="px-3 py-2.5"><RiskBadge level={item.level} prefix="" /></td>
                      <td className="px-3 py-2.5 text-muted">{item.details[0]}</td>
                      <td className="px-3 py-2.5">
                        {item.href ? (
                          <Link href={item.href} className="inline-flex min-h-11 items-center font-semibold text-primary underline">
                            Ver ponto
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => focusItem(item.key)}
                            disabled={tilesFailed}
                            className="inline-flex min-h-11 items-center font-semibold text-primary underline disabled:opacity-50"
                          >
                            Ver no mapa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedList.length > listLimit && (
                <div className="border-t border-border p-3 text-center">
                  <button
                    type="button"
                    onClick={() => setListLimit((n) => n + LIST_PAGE)}
                    className="min-h-11 rounded-lg border border-border px-4 font-semibold hover:bg-surface-2"
                  >
                    Mostrar mais ({sortedList.length - listLimit} restantes)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Legenda acessível: forma = categoria, cor + texto = criticidade */}
          <div className="card mt-3 p-4" role="group" aria-labelledby="legenda-titulo">
            <h3 id="legenda-titulo" className="font-display text-base font-semibold">
              Legenda
            </h3>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <ul className="flex flex-col gap-1.5 text-sm">
                {CATEGORIES.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <ShapeIcon
                      category={c}
                      size={18}
                      color={c === "alagamento" ? "var(--flood)" : c === "entulho" ? "var(--debris)" : "var(--critical)"}
                    />
                    <span>
                      <strong>{CATEGORY_LABEL[c]}</strong> — {CATEGORY_SHAPE_LABEL[c]}
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-1.5 text-sm">
                {LEVELS.map((l) => (
                  <li key={l} className="flex items-center gap-2">
                    <RiskBadge level={l} />
                  </li>
                ))}
                <li className="text-muted">A área colorida ao redor do círculo mostra o raio de risco.</li>
              </ul>
            </div>
            <p className="mt-3 text-xs text-muted">
              Dados simulados. Coordenadas aproximadas, com base no OpenStreetMap — não use para
              localizar endereços reais.
            </p>
          </div>
        </section>
      </div>

      {/* Painel de alertas */}
      <aside aria-labelledby="alertas-titulo" className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="alertas-titulo" className="font-display text-lg font-semibold">
            Alertas ativos
            {alerts.data && <span className="ml-2 text-sm font-normal text-muted">({alerts.data.total})</span>}
          </h2>
          <Link href="/alertas" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">
            Ver todos
          </Link>
        </div>
        {alerts.loading && <LoadingBlock label="Carregando alertas…" className="h-64" />}
        {alerts.error && <ErrorState title="Alertas indisponíveis" error={alerts.error} onRetry={alerts.reload} />}
        {alerts.data && alerts.data.items.length === 0 && <EmptyState title="Nenhum alerta ativo" />}
        {alerts.data && alerts.data.items.length > 0 && (
          <ul className="flex max-h-[70vh] flex-col gap-2.5 overflow-y-auto pr-1">
            {alerts.data.items.slice(0, 20).map((a) => (
              <AlertCard
                key={a.id}
                alert={a}
                onFocus={focusKeyOf(a) ? () => focusItem(focusKeyOf(a) as string) : undefined}
              />
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
