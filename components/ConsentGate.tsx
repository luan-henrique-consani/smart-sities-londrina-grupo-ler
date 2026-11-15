"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { IconAlert } from "@/components/icons";

/** Termo de Consentimento: bloqueia o sistema até o aceite (registra data e versão na API). */
export function ConsentGate() {
  const { user, consent, acceptConsent, logout } = useAuth();
  const id = useId();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    setBusy(true);
    setError(null);
    try {
      await acceptConsent();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <main className="card w-full max-w-xl p-6 md:p-8" aria-labelledby={`${id}-title`}>
        <Logo />
        <h1 id={`${id}-title`} className="mt-5 font-display text-2xl font-bold">
          Termo de Consentimento
        </h1>
        <p className="mt-2 text-muted">
          Olá{user ? `, ${user.name}` : ""}. Antes de usar a Prevora, leia e aceite o termo.
        </p>

        <ul className="mt-4 flex flex-col gap-2 text-sm">
          <li>● Guardamos seu nome, e-mail e cargo só para autenticar e controlar permissões.</li>
          <li>● Entrar, sair, exportar ou apagar dados ficam numa trilha de auditoria por 6 meses.</li>
          <li>● Não coletamos nenhum dado de cidadãos: guardamos o problema, não a pessoa.</li>
          <li>● Você pode exportar ou pedir a exclusão dos seus dados em &quot;Meus dados&quot;.</li>
        </ul>
        <p className="mt-3 text-sm">
          Leia o texto completo:{" "}
          <Link href="/termos" target="_blank" className="font-semibold underline">
            Termo de Consentimento
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" target="_blank" className="font-semibold underline">
            Política de Privacidade
          </Link>{" "}
          (abrem em nova aba).
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border-2 border-critical bg-surface px-3 py-2 text-sm font-medium text-critical"
          >
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--primary)]"
          />
          <span>
            Li e aceito o Termo de Consentimento (versão {consent?.required_version ?? "vigente"}).
          </span>
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAccept}
            disabled={!checked || busy}
            className="min-h-12 rounded-lg bg-primary px-5 font-bold text-on-primary disabled:opacity-50"
          >
            {busy ? "Registrando…" : "Aceitar e continuar"}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="min-h-12 rounded-lg border border-border px-5 font-medium hover:bg-surface-2"
          >
            Não aceito (sair)
          </button>
        </div>
      </main>
    </div>
  );
}
