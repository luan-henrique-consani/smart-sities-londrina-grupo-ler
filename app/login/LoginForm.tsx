"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";
import { errorMessage } from "@/lib/api";
import { Logo, LogoMark } from "@/components/Logo";
import { PrefsButtons } from "@/components/PrefsButtons";
import { OfflineBanner } from "@/components/OfflineBanner";
import { IconAlert } from "@/components/icons";

type FieldErrors = { email?: string; password?: string };

/** Só aceita caminhos internos (evita redirecionamento para outro site). */
function safeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export function LoginForm() {
  const { status, login, expired } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const id = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Já autenticado: segue para o destino.
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.replace(next);
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  const sessionMessage = expired
    ? "Sua sessão expirou. Entre novamente para continuar."
    : params.get("expirada")
      ? "Sua sessão expirou. Entre novamente para continuar."
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <OfflineBanner />
      <header className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Logo />
        <PrefsButtons />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
          <section aria-labelledby="hero-title" className="hidden md:block">
            <p className="mb-3 inline-flex rounded-full border-2 border-debris bg-surface px-3 py-1 text-xs font-bold text-debris">
              ◆ Dados simulados
            </p>
            <h1
              id="hero-title"
              className="font-display text-4xl font-bold leading-tight tracking-tight lg:text-5xl"
            >
              Antecipe o lixo e o alagamento antes que virem problema.
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted">
              A Prevora analisa chuva, histórico e reincidência para mostrar à Prefeitura de
              Londrina onde agir primeiro — com previsão, não só com resposta.
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-muted">
              <li>● Alagamentos: risco em 24 h, 72 h e 3 meses</li>
              <li>■ Resíduos: quando o lixo volta e quais pontos reincidem</li>
              <li>◆ Textos de conscientização prontos para revisar</li>
            </ul>
          </section>

          <section aria-labelledby="login-title" className="card mx-auto w-full max-w-md p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <LogoMark size={44} aria-hidden="true" role="presentation" aria-label={undefined} />
              <div>
                <h2 id="login-title" className="font-display text-2xl font-bold">
                  Entrar na Prevora
                </h2>
                <p className="text-sm text-muted">Acesso para servidores públicos.</p>
              </div>
            </div>

            {sessionMessage && !formError && (
              <p role="status" className="mb-4 rounded-lg border border-debris bg-surface px-3 py-2 text-sm text-debris">
                {sessionMessage}
              </p>
            )}
            {formError && (
              <p
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border-2 border-critical bg-surface px-3 py-2 text-sm font-medium text-critical"
              >
                <IconAlert size={18} className="mt-0.5 shrink-0" />
                {formError}
              </p>
            )}

            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-email`} className="text-sm font-semibold">
                  E-mail
                </label>
                <input
                  id={`${id}-email`}
                  type="email"
                  name="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? `${id}-email-err` : undefined}
                  className="min-h-11 rounded-lg border border-border bg-background px-3 text-base"
                />
                {errors.email && (
                  <p id={`${id}-email-err`} className="text-sm font-medium text-critical">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${id}-password`} className="text-sm font-semibold">
                  Senha
                </label>
                <input
                  id={`${id}-password`}
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? `${id}-password-err` : undefined}
                  className="min-h-11 rounded-lg border border-border bg-background px-3 text-base"
                />
                {errors.password && (
                  <p id={`${id}-password-err`} className="text-sm font-medium text-critical">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-12 rounded-lg bg-primary px-4 text-base font-bold text-on-primary disabled:opacity-60"
              >
                {submitting ? "Entrando…" : "Entrar"}
              </button>
            </form>

            <p className="mt-5 text-xs text-muted">
              A Prevora não coleta dados de cidadãos. Dos servidores, guarda apenas nome, e-mail e
              cargo. Todos os dados exibidos são simulados.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
