"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { QrCode } from "@/components/QrCode";
import { AccessRestricted } from "@/components/AccessRestricted";

export const INVITE_URL = "https://londrina-limpa.vercel.app/login";

const HIGHLIGHTS = [
  "Acesso gratuito e sem cadastro",
  "Explore mapas, previsões e indicadores",
  "Demonstração com dados simulados",
];

export function InviteView() {
  const { user } = useAuth();
  const [presenting, setPresenting] = useState(false);
  const backRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresenting(false);
    };
    window.addEventListener("keydown", onKey);
    backRef.current?.focus();
    const start = startRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      start?.focus();
    };
  }, [presenting]);

  if (user && user.role !== "admin" && user.role !== "gestor") return <AccessRestricted />;

  const content = (big: boolean) => (
    <div
      className={`mx-auto grid w-full items-center ${
        big ? "max-w-[110rem] gap-12 lg:grid-cols-[1.1fr_1fr]" : "max-w-6xl gap-8 lg:grid-cols-[1.1fr_1fr]"
      }`}
    >
      <div className="flex flex-col gap-6">
        <h1
          className={`font-display font-bold leading-tight ${
            big ? "text-4xl md:text-6xl xl:text-7xl" : "text-3xl md:text-5xl"
          }`}
        >
          Agora é sua vez de explorar a Prevora!
        </h1>
        <p className={`text-muted ${big ? "text-xl md:text-3xl" : "text-lg md:text-xl"}`}>
          Escaneie o QR Code e descubra como a inteligência preventiva pode transformar a gestão urbana.
        </p>
        <ul className="flex flex-col gap-3">
          {HIGHLIGHTS.map((h) => (
            <li
              key={h}
              className={`flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 font-semibold shadow-[inset_6px_0_0_var(--brand-yellow)] ${
                big ? "text-lg md:text-2xl" : "text-base md:text-lg"
              }`}
            >
              <span aria-hidden="true" className="text-primary">●</span>
              {h}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="w-full rounded-3xl bg-white p-3 shadow-lg ring-2 ring-primary">
          <QrCode
            value={INVITE_URL}
            label={`QR Code para acessar a Prevora em ${INVITE_URL}`}
            className={`mx-auto block aspect-square w-full ${
              big ? "max-w-[min(72vh,52rem)]" : "max-w-[24rem]"
            }`}
          />
        </div>
        <p
          className={`break-all text-center font-display font-bold text-primary ${
            big ? "text-xl md:text-3xl" : "text-base md:text-xl"
          }`}
        >
          {INVITE_URL}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Logo />
          <button
            ref={startRef}
            type="button"
            onClick={() => setPresenting(true)}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-semibold text-on-primary hover:opacity-90"
          >
            Modo apresentação
          </button>
        </div>
        {content(false)}
      </div>

      {presenting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modo apresentação: convite para explorar a Prevora"
          className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background p-6 md:p-10"
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <Logo />
            <button
              ref={backRef}
              type="button"
              onClick={() => setPresenting(false)}
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 font-semibold hover:bg-surface-2"
            >
              Voltar <span className="ml-2 text-xs font-normal text-muted">(Esc)</span>
            </button>
          </div>
          <div className="flex flex-1 items-center">{content(true)}</div>
        </div>
      )}
    </>
  );
}
