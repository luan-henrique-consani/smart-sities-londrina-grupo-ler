"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApi } from "@/lib/useApi";
import { formatDate } from "@/lib/format";
import type {
  GeneratedText,
  Kpis,
  Next3Months,
  SeasonalCalendar,
  YearlyResponse,
} from "@/lib/types";
import { KpiCard } from "@/components/KpiCard";
import { ChartFigure } from "@/components/charts/ChartFigure";
import { AiBadge } from "@/components/AiNotice";
import { IotVisionButton } from "@/components/IotVisionDialog";
import { ErrorState, LoadingBlock, StaleNotice } from "@/components/States";

type Module = "ambos" | "residuos" | "alagamentos";
type CountKey = "debris_episodes" | "recurrences" | "flood_events";

const AXIS = { fill: "var(--muted)", fontSize: 12 };
const nf = (n: number | null | undefined, d = 0) =>
  n === null || n === undefined ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: d });

function Tip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: readonly { name?: string | number; value?: unknown }[];
  label?: string | number;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-sm">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={String(p.name)}>
          {p.name}: {nf(Number(p.value))} {unit}
        </p>
      ))}
    </div>
  );
}

function YearChart({
  id,
  title,
  unit,
  data,
  color,
  round,
}: {
  id: string;
  title: string;
  unit: string;
  data: { year: string; value: number; current: boolean }[];
  color: string;
  round: boolean;
}) {
  const last = data[data.length - 1];
  const prev = data.slice(0, -1);
  const avg = prev.reduce((s, d) => s + d.value, 0) / Math.max(prev.length, 1);
  const diff = avg ? Math.round(((last.value - avg) / avg) * 100) : 0;
  return (
    <ChartFigure
      id={id}
      title={title}
      description={`Janeiro a novembro de cada ano. Em 2026 (destacado; sistema em uso desde julho) foram ${nf(last.value)} ${unit}, ${Math.abs(diff)}% ${diff <= 0 ? "abaixo" : "acima"} da média de 2022 a 2025 (${nf(avg)}).`}
      table={{
        caption: `${title} (jan–nov de cada ano, dados simulados)`,
        headers: ["Ano", `Total (${unit})`],
        rows: data.map((d) => [d.year, d.value]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} accessibilityLayer>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="year" tick={AXIS} stroke="var(--border)" />
          <YAxis tick={AXIS} stroke="var(--border)" />
          <Tooltip content={<Tip unit={unit} />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="value" name={title} radius={round ? 10 : 2} isAnimationActive={false}>
            {data.map((d) => (
              <Cell
                key={d.year}
                fill={color}
                fillOpacity={d.current ? 1 : 0.45}
                stroke={d.current ? "var(--foreground)" : "none"}
                strokeWidth={d.current ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

function ScenarioChart({
  id,
  title,
  unit,
  months,
  pick,
  color,
}: {
  id: string;
  title: string;
  unit: string;
  months: Next3Months["months"];
  pick: CountKey;
  color: string;
}) {
  const data = months.map((m) => ({
    mes: m.seasonal_events.includes("Carnaval") ? `${m.label} (Carnaval)` : m.label,
    "Sem ação": m[pick].without_action,
    "Com o plano": m[pick].with_plan,
  }));
  const tw = data.reduce((s, d) => s + d["Sem ação"], 0);
  const tp = data.reduce((s, d) => s + d["Com o plano"], 0);
  return (
    <ChartFigure
      id={id}
      title={title}
      description={`Projeção de dezembro de 2026 a fevereiro de 2027: ${nf(tw)} ${unit} sem ação preventiva contra ${nf(tp)} com o plano sugerido.`}
      table={{
        caption: `${title}: sem ação × com o plano (projeção simulada)`,
        headers: ["Mês", "Sem ação", "Com o plano"],
        rows: data.map((d) => [d.mes, d["Sem ação"], d["Com o plano"]]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} accessibilityLayer>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="mes" tick={AXIS} stroke="var(--border)" />
          <YAxis tick={AXIS} stroke="var(--border)" />
          <Tooltip content={<Tip unit={unit} />} cursor={{ fill: "var(--surface-2)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--foreground)" }} />
          <Bar dataKey="Sem ação" fill="var(--muted)" fillOpacity={0.55} isAnimationActive={false} />
          <Bar dataKey="Com o plano" fill={color} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFigure>
  );
}

export function ForecastsView() {
  const [module, setModule] = useState<Module>("ambos");
  const kpis = useApi<Kpis>("/api/kpis");
  const yearly = useApi<YearlyResponse>("/api/forecasts/yearly");
  const next = useApi<Next3Months>("/api/forecasts/next-3-months");
  const calendar = useApi<SeasonalCalendar>("/api/forecasts/seasonal-calendar");
  const explain = useApi<GeneratedText>("/api/ai/explain/forecasts");

  const imp = kpis.data?.impact;
  const showWaste = module !== "alagamentos";
  const showFlood = module !== "residuos";
  const years = yearly.data?.years;
  const rows = (key: CountKey) =>
    (years ?? []).map((y, i, arr) => ({
      year: y.partial ? `${y.year} (parcial)` : String(y.year),
      value: y.jan_to_ref[key],
      current: i === arr.length - 1,
    }));

  const events = (calendar.data?.events ?? []).filter(
    (e) => module === "ambos" || e.modules.includes(module === "residuos" ? "residuos" : "alagamentos"),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold">Previsões e resultados</h1>
        <p className="max-w-3xl text-muted">
          O que mudou desde que a Prevora passou a apoiar as decisões (julho de 2026) e o que esperar
          dos próximos três meses. Todos os dados são simulados.
        </p>
        <IotVisionButton />
      </header>

      {(kpis.stale || yearly.stale || next.stale) && <StaleNotice />}

      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="mb-1 text-sm font-semibold text-muted">Módulo</legend>
        {(
          [
            ["ambos", "Os dois"],
            ["residuos", "Resíduos"],
            ["alagamentos", "Alagamentos"],
          ] as const
        ).map(([v, l]) => (
          <label
            key={v}
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 px-4 font-semibold focus-within:outline-3 focus-within:outline-primary ${
              module === v ? "border-primary bg-primary-soft" : "border-border bg-surface"
            }`}
          >
            <input
              type="radio"
              name="modulo"
              value={v}
              checked={module === v}
              onChange={() => setModule(v)}
              className="sr-only"
            />
            {module === v && <span aria-hidden="true">✓</span>}
            {l}
          </label>
        ))}
      </fieldset>

      <section aria-labelledby="impacto" className="flex flex-col gap-3">
        <h2 id="impacto" className="font-display text-xl font-semibold">
          Impacto das previsões
        </h2>
        {kpis.error && <ErrorState error={kpis.error} onRetry={kpis.reload} />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {showWaste && (
            <KpiCard
              category="reincidente"
              label="Reincidência nos próximos 3 meses"
              loading={kpis.loading}
              value={imp ? `${nf(imp.recurrence.next_3_months_change_pct)}%` : ""}
              hint={
                imp
                  ? `com o plano. Já caiu ${nf(Math.abs(imp.recurrence.change_pct ?? 0))}% desde julho.`
                  : undefined
              }
            />
          )}
          {showWaste && (
            <KpiCard
              category="entulho"
              label="Dias com o ponto limpo"
              loading={kpis.loading}
              value={imp ? `${nf(imp.days_clean.before)} → ${nf(imp.days_clean.after)}` : ""}
              suffix="dias"
              hint="média antes × depois das previsões"
            />
          )}
          {showFlood && (
            <KpiCard
              category="alagamento"
              label="Alagamentos previstos × ocorridos"
              loading={kpis.loading}
              value={imp ? `${nf(imp.flood_accuracy.pct)}%` : ""}
              suffix="de acerto"
              hint={
                imp
                  ? `${imp.flood_accuracy.predicted} previstos de ${imp.flood_accuracy.occurred} ocorridos`
                  : undefined
              }
            />
          )}
          {showFlood && (
            <KpiCard
              category="alagamento"
              label="Bocas de lobo limpas antes da chuva forte"
              loading={kpis.loading}
              value={
                imp
                  ? `${nf(imp.drains_before_rain.before_pct)}% → ${nf(imp.drains_before_rain.after_pct)}%`
                  : ""
              }
              hint="antes × depois das previsões"
            />
          )}
          <KpiCard
            label="Horas de equipe economizadas"
            loading={kpis.loading}
            value={imp ? `≈${nf(imp.team_hours_saved.per_quarter)} h` : ""}
            hint="por trimestre (estimativa)"
          />
        </div>
      </section>

      <section aria-labelledby="ia" className="card flex flex-col gap-2 p-4">
        <h2 id="ia" className="font-display text-xl font-semibold">
          Resumo gerado por IA
        </h2>
        {explain.loading && <LoadingBlock label="Gerando o resumo…" className="h-20" />}
        {explain.error && (
          <p className="text-muted">
            Não foi possível gerar o resumo agora. Os números desta tela continuam válidos.
          </p>
        )}
        {explain.data && (
          <>
            <p className="whitespace-pre-line">{explain.data.text}</p>
            <AiBadge badge={explain.data.badge} mode={explain.data.mode} />
          </>
        )}
      </section>

      <section aria-labelledby="hist" className="flex flex-col gap-3">
        <h2 id="hist" className="font-display text-xl font-semibold">
          Histórico por ano (2022–2026)
        </h2>
        {yearly.loading && <LoadingBlock label="Carregando o histórico…" className="h-64" />}
        {yearly.error && <ErrorState error={yearly.error} onRetry={yearly.reload} />}
        {years && (
          <div className="grid gap-4 lg:grid-cols-2">
            {showWaste && (
              <YearChart
                id="c-entulho"
                title="Episódios de entulho por ano"
                unit="episódios"
                data={rows("debris_episodes")}
                color="var(--debris)"
                round={false}
              />
            )}
            {showFlood && (
              <YearChart
                id="c-alag"
                title="Alagamentos por ano"
                unit="alagamentos"
                data={rows("flood_events")}
                color="var(--flood)"
                round
              />
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="prox" className="flex flex-col gap-3">
        <h2 id="prox" className="font-display text-xl font-semibold">
          Próximos 3 meses: sem ação × com o plano
        </h2>
        {next.loading && <LoadingBlock label="Carregando a projeção…" className="h-64" />}
        {next.error && <ErrorState error={next.error} onRetry={next.reload} />}
        {next.data && (
          <>
            <p className="text-sm text-muted">
              Dezembro de 2026 a fevereiro de 2027, com Natal, Ano-Novo e Carnaval. Base:{" "}
              {next.data.baseline}.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {showWaste && (
                <ScenarioChart
                  id="n-ent"
                  title="Entulho previsto"
                  unit="episódios"
                  months={next.data.months}
                  pick="debris_episodes"
                  color="var(--debris)"
                />
              )}
              {showWaste && (
                <ScenarioChart
                  id="n-rec"
                  title="Reincidências previstas"
                  unit="retornos"
                  months={next.data.months}
                  pick="recurrences"
                  color="var(--critical)"
                />
              )}
              {showFlood && (
                <ScenarioChart
                  id="n-alag"
                  title="Alagamentos previstos"
                  unit="alagamentos"
                  months={next.data.months}
                  pick="flood_events"
                  color="var(--flood)"
                />
              )}
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="cal" className="flex flex-col gap-3">
        <h2 id="cal" className="font-display text-xl font-semibold">
          Calendário de riscos sazonais
        </h2>
        {calendar.loading && <LoadingBlock label="Carregando o calendário…" className="h-32" />}
        {calendar.error && <ErrorState error={calendar.error} onRetry={calendar.reload} />}
        <ul className="grid gap-3 md:grid-cols-2">
          {events.map((e) => (
            <li key={`${e.key}-${e.start}`} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold">{e.name}</h3>
                {e.active && (
                  <span className="rounded-full border-2 border-primary px-2 py-0.5 text-xs font-bold text-primary">
                    Em curso
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">
                {formatDate(e.start)} a {formatDate(e.end)}
                {!e.active && e.days_until > 0 && ` · começa em ${e.days_until} dias`}
              </p>
              <p className="mt-1">{e.description}</p>
              <p className="mt-2 text-sm font-semibold">
                Eleva:{" "}
                {e.modules.map((m) => (m === "residuos" ? "■ entulho" : "● alagamento")).join(" e ")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ganho" className="grid gap-3 md:grid-cols-2">
        <h2 id="ganho" className="sr-only">
          O ganho para quem decide e para quem mora na cidade
        </h2>
        <div className="card p-4">
          <h3 className="font-display text-lg font-semibold">Para o servidor</h3>
          <p className="mt-1">
            Menos retornos ao mesmo ponto, equipes enviadas antes da chuva e decisões justificadas por
            números: cada recomendação mostra a previsão que a motivou.
          </p>
        </div>
        <div className="card p-4">
          <h3 className="font-display text-lg font-semibold">Para o cidadão</h3>
          <p className="mt-1">
            Rua limpa por mais tempo, menos lixo entupindo bocas de lobo e menos alagamento em áreas
            como o Lago Igapó. A Prevora não coleta dados de moradores.
          </p>
        </div>
      </section>
    </div>
  );
}
