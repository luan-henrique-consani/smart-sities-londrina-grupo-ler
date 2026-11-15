"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { WASTE_LABEL } from "@/lib/format";
import type { Audience, AwarenessResult, Material, Page, PointSummary, Tone } from "@/lib/types";
import { AiBadge } from "@/components/AiNotice";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/States";

const MATERIALS: [Material, string][] = [
  ["poster", "Cartaz"],
  ["social", "Post para redes"],
  ["door_to_door", "Porta a porta"],
  ["action_plan", "Plano de ação de 30 dias"],
];
const AUDIENCES: [Audience, string][] = [
  ["moradores", "Moradores do entorno"],
  ["comerciantes", "Comerciantes"],
  ["escolas", "Comunidade escolar"],
  ["geral", "População em geral"],
];
const TONES: [Tone, string][] = [
  ["amigavel", "Amigável"],
  ["informativo", "Informativo"],
  ["direto", "Direto"],
];

const SELECT = "min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground";

export function AwarenessView() {
  const { user } = useAuth();
  const canGenerate = user?.role === "admin" || user?.role === "gestor";
  const params = useSearchParams();
  const fromUrl = params.get("ponto");

  const points = useApi<Page<PointSummary>>(canGenerate ? "/api/points?chronic=true&page_size=100" : null);
  const [pointId, setPointId] = useState<string>(fromUrl ?? "");
  const [material, setMaterial] = useState<Material>("poster");
  const [audience, setAudience] = useState<Audience>("moradores");
  const [tone, setTone] = useState<Tone>("amigavel");
  const [variant, setVariant] = useState<number | undefined>(undefined);
  const [state, setState] = useState<{ key: string; result?: AwarenessResult; error?: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);

  const items = points.data?.items;
  // Sem ponto na URL, começa pelo primeiro reincidente da lista.
  const effectivePoint = pointId || items?.[0]?.id || "";
  const options =
    items && effectivePoint && !items.some((p) => p.id === effectivePoint)
      ? [{ id: effectivePoint, area_name: "ponto selecionado", waste_type: "" } as PointSummary, ...items]
      : items;

  const key = `${effectivePoint}|${material}|${audience}|${tone}|${variant ?? "-"}|${nonce}`;
  // Busca o material sempre que as opções mudam (estado só é gravado nos callbacks).
  useEffect(() => {
    if (!canGenerate || !effectivePoint) return;
    let alive = true;
    api
      .post<AwarenessResult>("/api/ai/awareness", {
        point_id: effectivePoint,
        material,
        audience,
        tone,
        ...(variant !== undefined ? { variant } : {}),
      })
      .then((result) => alive && setState({ key, result }))
      .catch((e: unknown) => alive && setState({ key, error: errorMessage(e) }));
    return () => {
      alive = false;
    };
  }, [canGenerate, effectivePoint, material, audience, tone, variant, key]);

  const current = state?.key === key ? state : null;
  const busy = canGenerate && !!effectivePoint && current === null;
  const result = current?.result ?? state?.result ?? null; // mantém o texto anterior enquanto gera
  const error = current?.error ?? null;
  /** O texto às vezes repete o título na primeira linha: tira a repetição e o marcador de logo. */
  const body = (r: AwarenessResult) =>
    r.text
      .replace(/^\s*\[LOGO DA PREFEITURA\]\s*/i, "")
      .split(/\r?\n/)
      .filter((l, i) => !(i < 3 && l.trim().toLowerCase() === r.title.trim().toLowerCase()))
      .join(String.fromCharCode(10))
      .trim();
  const generate = () => setNonce((n) => n + 1);

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`${result.title}\n\n${result.text}`);
      setCopied("ok");
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setCopied("fail");
    }
  }

  if (user && !canGenerate) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <h1 className="font-display text-3xl font-bold">Conscientização</h1>
        <EmptyState title="Seu perfil não gera materiais">
          Cartazes, posts e planos são gerados por Administradores e Gestores (CMTU/CTD).
        </EmptyState>
        <Link href="/pontos" className="min-h-11 w-fit rounded-lg bg-primary px-4 py-2.5 font-semibold text-on-primary">
          Ver pontos reincidentes
        </Link>
      </div>
    );
  }

  const point = items?.find((p) => p.id === effectivePoint);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-2 print:hidden">
        <h1 className="font-display text-3xl font-bold">Conscientização</h1>
        <p className="max-w-3xl text-muted">
          Materiais para ir além da limpeza nos pontos reincidentes. Os números vêm dos modelos
          estatísticos; o texto é escrito por IA ou por um modelo pronto. Revise antes de usar.
        </p>
      </header>

      <form
        className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 print:hidden"
        aria-label="Opções do material"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-3">
          Ponto reincidente
          <select
            value={effectivePoint}
            onChange={(e) => {
              setPointId(e.target.value);
              setVariant(undefined);
            }}
            className={SELECT}
            disabled={!options}
          >
            {!options && <option>Carregando…</option>}
            {options?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.area_name}
                {p.waste_type ? ` · ${WASTE_LABEL[p.waste_type] ?? p.waste_type}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">
          Público
          <select
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value as Audience);
              setVariant(undefined);
            }}
            className={SELECT}
          >
            {AUDIENCES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Tom
          <select
            value={tone}
            onChange={(e) => {
              setTone(e.target.value as Tone);
              setVariant(undefined);
            }}
            className={SELECT}
          >
            {TONES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </form>

      {points.error && <ErrorState error={points.error} onRetry={points.reload} />}
      {items && items.length === 0 && !fromUrl && (
        <EmptyState title="Nenhum reincidente crônico no momento">
          Abra um ponto na lista de pontos e use “Gerar materiais”.
        </EmptyState>
      )}

      <div role="tablist" aria-label="Tipo de material" className="flex flex-wrap gap-2 print:hidden">
        {MATERIALS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="tab"
            id={`tab-${v}`}
            aria-selected={material === v}
            aria-controls="painel-material"
            tabIndex={material === v ? 0 : -1}
            onClick={() => {
              setMaterial(v);
              setVariant(undefined);
            }}
            onKeyDown={(e) => {
              const i = MATERIALS.findIndex(([m]) => m === material);
              const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
              if (next === null) return;
              e.preventDefault();
              const n = MATERIALS[(next + MATERIALS.length) % MATERIALS.length][0];
              setMaterial(n);
              setVariant(undefined);
              document.getElementById(`tab-${n}`)?.focus();
            }}
            className={`min-h-11 rounded-lg border-2 px-4 font-semibold ${
              material === v ? "border-primary bg-primary-soft" : "border-border bg-surface"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <section
        id="painel-material"
        role="tabpanel"
        aria-labelledby={`tab-${material}`}
        aria-busy={busy}
        className="flex flex-col gap-3"
      >
        {busy && !result && <LoadingBlock label="Gerando o material…" className="h-64" />}
        {error && <ErrorState error={new Error(error)} onRetry={generate} title="Não foi possível gerar o material" />}

        {result && (
          <>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <AiBadge badge={result.badge} mode={result.mode} />
              <div className="flex-1" />
              <button
                type="button"
                disabled={busy}
                onClick={() => setVariant((result.variant ?? 0) + 1)}
                className="min-h-11 rounded-lg border-2 border-primary px-4 font-semibold text-primary disabled:opacity-60"
              >
                {busy ? "Gerando…" : "Gerar outra versão"}
              </button>
              <button type="button" onClick={copy} className="min-h-11 rounded-lg border border-border px-4 font-semibold">
                Copiar texto
              </button>
              {material === "poster" && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary"
                >
                  Baixar PDF
                </button>
              )}
            </div>
            <p role="status" className="sr-only">
              {copied === "ok" ? "Texto copiado." : copied === "fail" ? "Não foi possível copiar." : ""}
            </p>
            {copied && (
              <p aria-hidden="true" className={`text-sm font-semibold print:hidden ${copied === "ok" ? "text-primary" : "text-critical"}`}>
                {copied === "ok" ? "Texto copiado." : "Não foi possível copiar. Selecione o texto e use Ctrl+C."}
              </p>
            )}

            {material === "poster" ? (
              <div className="overflow-x-auto">
                <article
                  id="poster-print"
                  aria-label={`Prévia do cartaz A4: ${result.title}`}
                  className="mx-auto flex aspect-[210/297] w-full min-w-[20rem] max-w-[34rem] flex-col gap-4 border-[6px] border-[#0046aa] bg-white p-8 text-[#141a26] shadow-lg"
                >
                  <p className="text-center text-xs font-bold tracking-widest text-[#465068]">
                    [LOGO DA PREFEITURA]
                  </p>
                  <h2 className="text-center font-display text-3xl font-bold leading-tight text-[#0046aa]">
                    {result.title}
                  </h2>
                  <p className="flex-1 whitespace-pre-line text-lg leading-snug">
                    {body(result)}
                  </p>
                  <p className="border-t-2 border-[#d2d9e6] pt-2 text-center text-xs text-[#465068]">
                    {result.badge} · dados simulados
                  </p>
                </article>
              </div>
            ) : (
              <article className="card p-5">
                <h2 className="font-display text-xl font-semibold">{result.title}</h2>
                <p className="mt-3 whitespace-pre-line">{body(result)}</p>
              </article>
            )}
          </>
        )}
        {point && (
          <p className="text-sm text-muted print:hidden">
            Base: {point.n_episodes} episódios no histórico do ponto {point.id}.{" "}
            <Link href={`/pontos/${point.id}`} className="text-primary underline">
              Ver o ponto
            </Link>
          </p>
        )}
      </section>

      <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted print:hidden">
        Use os marcadores entre colchetes (como [PONTO DE ENTREGA MAIS PRÓXIMO]) para completar com
        informações locais. Não há logos oficiais nesta versão. Ao registrar a ação em campo, anote
        só o problema, nunca dados de moradores.
      </p>
    </div>
  );
}
