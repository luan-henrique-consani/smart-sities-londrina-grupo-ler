"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientLog";

/** Última barreira: falhas no layout raiz. Usa estilos próprios (o CSS global pode não ter carregado). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError({ message: error.message, stack: error.stack, component: "app/global-error.tsx" });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F5F6F3", color: "#1B1F1D", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
          <h1 style={{ color: "#B42318" }}>Prevora fora do ar por um instante</h1>
          <p>Ocorreu um erro inesperado ao carregar o sistema. Tente novamente.</p>
          <button
            type="button"
            onClick={reset}
            style={{ minHeight: 44, padding: "0 20px", borderRadius: 8, border: 0, background: "#0E6B60", color: "#fff", fontWeight: 700 }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
