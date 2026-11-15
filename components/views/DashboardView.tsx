"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { HORIZON_LABEL, ROLE_LABEL } from "@/lib/format";
import type {
  Alert,
  FloodAreasResponse,
  Kpis,
  Meta,
  Page,
  PointSummary,
  RiskLevel,
} from "@/lib/types";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard } from "@/components/AlertList";
import { DistributionBar } from "@/components/DistributionBar";
import { ErrorState, LoadingBlock, StaleNotice } from "@/components/States";
import { RiskBadge } from "@/components/Shapes";
import { IconArrowRight } from "@/components/icons";

function Section({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="font-display text-xl font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const kpis = useApi<Kpis>("/api/kpis");
  const meta = useApi<Meta>("/api/meta");
  const alerts = useApi<Page<Alert>>("/api/alerts?page_size=200");
  const floods = useApi<FloodAreasResponse>("/api/flood-areas?horizon=72h");
  const points = useApi<Page<PointSummary>>("/api/points?page_size=500");

  const alertStats = useMemo(() => {
    const items = alerts.data?.items ?? [];
    return {
      total: alerts.data?.total ?? 0,
      urgent: items.filter((a) => a.severity === "critical" || a.severity === "high").length,
      critical: items.filter((a) => a.severity === "critical").length,
    };
  }, [alerts.data]);

  const pointLevels = useMemo(() => {
    const c: Record<RiskLevel, number> = { alto: 0, médio: 0, baixo: 0 };
    points.data?.items.forEach((p) => (c[p.risk] += 1));
    return c;
  }, [points.data]);

  const floodLevels = useMemo(() => {
    const c: Record<RiskLevel, number> = { alto: 0, médio: 0, baixo: 0 };
    floods.data?.items.forEach((a) => (c[a.level] += 1));
    return c;
  }, [floods.data]);

  const drains = useMemo(() => {
    const items = floods.data?.items ?? [];
    return {
      clogged: items.reduce((s, a) => s + a.factors.clogged_drains, 0),
      total: items.reduce((s, a) => s + a.factors.total_drains, 0),
    };
  }, [floods.data]);

  const pendingCleanings = points.data?.items.filter((p) => p.pending_cleaning).length;
  const topAreas = floods.data?.items.slice(0, 5) ?? [];
  const stale = [kpis, meta, alerts, floods, points].some((r) => r.stale);
  const k = kpis.data?.map;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7">
      <header>
        <h1 className="font-display text-3xl font-bold">
          Painel de gestão{user && user.role !== "visitante" ? ` — olá, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 max-w-3xl text-muted">
          Visão geral de Londrina para decidir onde agir primeiro: risco de alagamento, lixo que
          volta a acumular e pontos que reincidem.
          {user && <> Perfil: {ROLE_LABEL[user.role]}.</>}
        </p>
      </header>

      {stale && <StaleNotice />}

      <Section
        id="kpi-hoje"
        title="Situação de hoje"
        action={
          <Link href="/mapa" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline">
            Abrir o mapa <IconArrowRight size={16} />
          </Link>
        }
      >
        {kpis.error ? (
          <ErrorState title="Indicadores indisponíveis" error={kpis.error} onRetry={kpis.reload} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              category="alagamento"
              label="Áreas com risco alto (72 h)"
              loading={kpis.loading}
              value={k?.high_risk_areas_72h ?? "—"}
              hint="Chuva, histórico, bocas de lobo e lixo por perto."
            />
            <KpiCard
              category="entulho"
              label="Entulho previsto em 7 dias"
              loading={kpis.loading}
              value={k?.debris_points_next_7d ?? "—"}
              suffix="pontos"
              hint="Pontos com novo acúmulo esperado."
            />
            <KpiCard
              category="reincidente"
              label="Reincidentes crônicos"
              loading={kpis.loading}
              value={k?.chronic_points ?? "—"}
              suffix="pontos"
              hint="3+ episódios em 15 dias."
            />
            <KpiCard
              category="alagamento"
              label="Bocas de lobo limpas antes da chuva"
              loading={kpis.loading}
              value={k?.drains_cleaned_before_rain_pct ?? "—"}
              suffix={k?.drains_cleaned_before_rain_pct != null ? "%" : undefined}
              hint="Antes de chuva forte, com o plano."
            />
          </div>
        )}
      </Section>

      <Section id="kpi-base" title="Base monitorada e alertas">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Pontos de descarte monitorados"
            loading={meta.loading}
            value={meta.data?.counts.points?.toLocaleString("pt-BR") ?? "—"}
            hint="Dados simulados."
          />
          <KpiCard
            label="Áreas de alagamento"
            loading={meta.loading}
            value={meta.data?.counts.flood_areas ?? "—"}
            hint={meta.data ? `${meta.data.counts.drains ?? 0} bocas de lobo cadastradas.` : undefined}
          />
          <KpiCard
            label="Alertas ativos"
            loading={alerts.loading}
            value={alerts.data ? alertStats.total : "—"}
            hint="Todos os tipos."
          />
          <KpiCard
            label="Alertas urgentes"
            loading={alerts.loading}
            value={alerts.data ? alertStats.urgent : "—"}
            hint={alerts.data ? `${alertStats.critical} crítico(s) e ${alertStats.urgent - alertStats.critical} alto(s).` : undefined}
          />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        <Section id="condicoes" title="Condições urbanas monitoradas">
          <div className="card flex flex-col gap-5 p-4">
            {floods.loading || points.loading ? (
              <LoadingBlock className="h-48" label="Carregando condições…" />
            ) : (
              <>
                <DistributionBar
                  title={`Áreas de alagamento por criticidade (${HORIZON_LABEL["72h"]})`}
                  counts={floodLevels}
                  unit="áreas"
                />
                <DistributionBar title="Pontos de descarte por criticidade" counts={pointLevels} unit="pontos" />
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted">Chuva prevista</dt>
                    <dd className="font-semibold">
                      {floods.data?.rain
                        ? `${floods.data.rain.rain_24h_mm.toLocaleString("pt-BR")} mm em 24 h`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Bocas de lobo entupidas</dt>
                    <dd className="font-semibold">
                      {drains.total > 0 ? `${drains.clogged} de ${drains.total} nas áreas de risco` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Limpezas pendentes</dt>
                    <dd className="font-semibold">
                      {pendingCleanings !== undefined ? `${pendingCleanings} pontos` : "—"}
                    </dd>
                  </div>
                </dl>
              </>
            )}
            {(floods.error || points.error) && (
              <ErrorState
                title="Parte das condições não carregou"
                error={floods.error ?? points.error}
                onRetry={() => {
                  floods.reload();
                  points.reload();
                }}
              />
            )}
          </div>
        </Section>

        <Section
          id="areas-risco"
          title="Áreas de alagamento mais críticas (72 h)"
          action={
            <Link href="/mapa" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">
              Ver no mapa
            </Link>
          }
        >
          {floods.loading ? (
            <LoadingBlock className="h-48" label="Carregando áreas…" />
          ) : topAreas.length > 0 ? (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-sm">
                <caption className="sr-only">Cinco áreas de alagamento com maior risco em 72 horas.</caption>
                <thead className="border-b border-border text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Área</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Risco</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Bocas entupidas</th>
                  </tr>
                </thead>
                <tbody>
                  {topAreas.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 font-medium">
                        <Link
                          href={`/mapa?foco=${a.id}`}
                          className="inline-flex min-h-11 items-center text-primary underline"
                        >
                          {a.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="mr-2 font-semibold">{a.score}/100</span>
                        <RiskBadge level={a.level} prefix="" />
                      </td>
                      <td className="px-3 py-2.5">
                        {a.factors.clogged_drains} de {a.factors.total_drains}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !floods.error && <p className="text-muted">Nenhuma área para exibir.</p>
          )}
        </Section>
      </div>

      <Section
        id="alertas-urgentes"
        title="Alertas mais urgentes"
        action={
          <Link href="/alertas" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline">
            Ver todos os alertas <IconArrowRight size={16} />
          </Link>
        }
      >
        {alerts.loading && <LoadingBlock className="h-40" label="Carregando alertas…" />}
        {alerts.error && <ErrorState title="Alertas indisponíveis" error={alerts.error} onRetry={alerts.reload} />}
        {alerts.data && (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {alerts.data.items.slice(0, 6).map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </ul>
        )}
      </Section>

      <p className="text-sm text-muted">
        Todos os números vêm da API da Prevora e são <strong>simulados</strong>
        {meta.data?.coordinates_notice ? `. ${meta.data.coordinates_notice}` : "."}
      </p>
    </div>
  );
}
