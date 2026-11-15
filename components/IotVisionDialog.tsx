"use client";

import { useEffect, useRef, useState } from "react";

type Tab = "drenagem" | "residuos";

const STEPS = [
  { n: 1, title: "Sensores em pontos estratégicos", text: "Equipamentos instalados em locais escolhidos com os técnicos." },
  { n: 2, title: "Transmissão e validação", text: "As leituras são enviadas e conferidas antes de serem usadas." },
  { n: 3, title: "Análise integrada", text: "Cruzamento com chuva prevista, histórico e intervenções já feitas." },
  { n: 4, title: "Recomendação preventiva", text: "A Prevora sugere a ação; quem decide é o servidor." },
];

const TABS: Record<Tab, { label: string; shape: string; intro: string; items: string[]; limit: string }> = {
  drenagem: {
    label: "Drenagem",
    shape: "●",
    intro: "Sensores de nível de água em pontos críticos de drenagem, como bocas de lobo e galerias.",
    items: [
      "Monitoramento potencial do nível de água.",
      "Identificação de alterações que justifiquem uma vistoria.",
      "Cruzamento futuro com a chuva prevista e o histórico da área.",
    ],
    limit: "Atenção: nível elevado não comprova entupimento. A leitura indica onde vistoriar; a confirmação é do técnico em campo.",
  },
  residuos: {
    label: "Resíduos",
    shape: "■",
    intro: "Sensores de preenchimento em contêineres e estruturas adequadas para esse tipo de medição.",
    items: [
      "Monitoramento potencial do preenchimento de contêineres.",
      "Identificação de acúmulo antes da saturação, para antecipar a coleta.",
    ],
    limit: "Atenção: sensores de preenchimento não monitoram automaticamente terrenos abertos, onde ocorre boa parte do descarte irregular.",
  },
};

const PILOT = [
  "Selecionar poucos pontos críticos.",
  "Avaliar a viabilidade e a instalação dos sensores.",
  "Comparar as leituras com vistorias reais.",
  "Validar os alertas antes de ampliar a solução.",
];

/** Botão + modal informativo (somente leitura) sobre a evolução futura com sensores IoT. Conceito, não implementado. */
export function IotVisionButton() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("drenagem");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const cur = TABS[tab];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-primary"
      >
        <span aria-hidden="true">◇</span>
        Visão futura: sensores IoT
      </button>

      <dialog
        ref={ref}
        aria-labelledby="iot-title"
        onClose={() => setOpen(false)}
        className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
      >
        <div className="flex max-h-[90vh] flex-col gap-6 overflow-y-auto p-5 sm:p-7">
          <header className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <p className="inline-flex w-fit items-center rounded-full border-2 border-debris px-3 py-1 text-sm font-bold">
                Conceito futuro — Não implementado
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar e voltar às previsões"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface px-3 font-semibold hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-primary"
              >
                <span aria-hidden="true">✕</span>
                <span className="ml-2 hidden sm:inline">Fechar</span>
              </button>
            </div>
            <h2 id="iot-title" className="font-display text-2xl font-bold sm:text-3xl">
              IoT — Próxima Etapa
            </h2>
            <p className="text-lg text-muted">Da previsão histórica à prevenção orientada por sensores.</p>
          </header>

          <section aria-labelledby="iot-como" className="flex flex-col gap-3">
            <h3 id="iot-como" className="font-display text-xl font-semibold">
              Como funcionaria
            </h3>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.n} className="card relative flex flex-col gap-1 p-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary"
                  >
                    {s.n}
                  </span>
                  <p className="font-display font-semibold">
                    <span className="sr-only">Etapa {s.n}: </span>
                    {s.title}
                  </p>
                  <p className="text-sm text-muted">{s.text}</p>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="absolute right-3 top-4 text-muted lg:-right-3.5 lg:top-1/2">
                      <span className="lg:hidden">↓</span>
                      <span className="hidden lg:inline">→</span>
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p className="rounded-lg bg-primary-soft p-3 font-medium">
              Os sensores complementam o trabalho dos técnicos, sem substituí-los.
            </p>
          </section>

          <section aria-labelledby="iot-usos" className="flex flex-col gap-3">
            <h3 id="iot-usos" className="font-display text-xl font-semibold">
              Casos de uso
            </h3>
            <div role="tablist" aria-label="Casos de uso" className="flex flex-wrap gap-2">
              {(Object.keys(TABS) as Tab[]).map((k) => (
                <button
                  key={k}
                  role="tab"
                  id={`iot-tab-${k}`}
                  type="button"
                  aria-selected={tab === k}
                  aria-controls="iot-panel"
                  tabIndex={tab === k ? 0 : -1}
                  onClick={() => setTab(k)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                      const next: Tab = k === "drenagem" ? "residuos" : "drenagem";
                      setTab(next);
                      requestAnimationFrame(() => document.getElementById(`iot-tab-${next}`)?.focus());
                    }
                  }}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg border-2 px-4 font-semibold focus-visible:outline-3 focus-visible:outline-primary ${
                    tab === k ? "border-primary bg-primary-soft" : "border-border bg-surface"
                  }`}
                >
                  <span aria-hidden="true">{TABS[k].shape}</span>
                  {TABS[k].label}
                </button>
              ))}
            </div>
            <div id="iot-panel" role="tabpanel" aria-labelledby={`iot-tab-${tab}`} className="card flex flex-col gap-3 p-4">
              <p>{cur.intro}</p>
              <ul className="list-disc space-y-1 pl-5">
                {cur.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="rounded-lg border-2 border-border p-3 text-sm font-medium">{cur.limit}</p>
            </div>
          </section>

          <section aria-labelledby="iot-piloto" className="flex flex-col gap-3">
            <h3 id="iot-piloto" className="font-display text-xl font-semibold">
              Próximo passo: piloto controlado
            </h3>
            <ol className="grid gap-2 sm:grid-cols-2">
              {PILOT.map((t, i) => (
                <li key={t} className="card flex items-start gap-3 p-3">
                  <span aria-hidden="true" className="font-display text-lg font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted">
              Apresentação informativa. Não há sensores, leituras ou alertas reais nesta versão da Prevora.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-on-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Voltar às previsões
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}
