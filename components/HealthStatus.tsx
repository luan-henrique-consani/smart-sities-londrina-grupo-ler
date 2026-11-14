"use client";

import { useEffect, useState } from "react";

type Health = { status: string; version: string; time: string };

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: Health }
  | { kind: "error"; message: string };

const TIMEOUT_MS = 8000;

async function fetchHealth(): Promise<Health> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/health", {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`A API respondeu com erro (HTTP ${res.status}).`);
    return (await res.json()) as Health;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("A API demorou demais para responder.");
    }
    if (err instanceof TypeError) {
      throw new Error("Não foi possível conectar à API.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export function HealthStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((data) => {
        if (active) setState({ kind: "ok", data });
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Erro inesperado ao consultar a API.";
        setState({ kind: "error", message });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }

  return (
    <section
      aria-labelledby="health-title"
      className="rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <h2 id="health-title" className="font-display text-xl font-semibold">
        Status da API
      </h2>

      <div aria-live="polite" className="mt-3">
        {state.kind === "loading" && (
          <p className="text-muted">Consultando /api/health…</p>
        )}

        {state.kind === "ok" && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-muted">Status</dt>
            <dd className="font-semibold">
              {state.data.status === "ok" ? (
                <span className="text-primary">● No ar (ok)</span>
              ) : (
                <span className="text-debris">▲ Degradado ({state.data.status})</span>
              )}
            </dd>
            <dt className="text-muted">Versão</dt>
            <dd>{state.data.version}</dd>
            <dt className="text-muted">Horário do servidor</dt>
            <dd>{formatTime(state.data.time)} (Brasília)</dd>
          </dl>
        )}

        {state.kind === "error" && (
          <p className="font-semibold text-critical">✕ {state.message}</p>
        )}
      </div>

      <button
        type="button"
        onClick={retry}
        disabled={state.kind === "loading"}
        className="mt-4 min-h-11 rounded-lg bg-primary px-4 font-medium text-white disabled:opacity-60"
      >
        Verificar de novo
      </button>
    </section>
  );
}
