"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientLog";
import { ErrorState } from "@/components/States";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError({
      message: error.message,
      stack: error.stack,
      component: "app/error.tsx",
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center p-4">
      <div className="w-full">
        <ErrorState
          title="Algo deu errado"
          error={new Error("Ocorreu um erro inesperado. Você pode tentar de novo; se persistir, avise a equipe técnica.")}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
