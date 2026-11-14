import { HealthStatus } from "@/components/HealthStatus";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <p className="w-fit rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-muted">
          Dados simulados
        </p>
        <h1 className="font-display text-4xl font-bold text-primary sm:text-5xl">
          Londrina Limpa
        </h1>
        <p className="text-lg text-muted">
          Gestão preventiva de resíduos e alagamentos para a Prefeitura de
          Londrina. Página provisória da Fase 1: confirma que o site e a API
          estão no ar.
        </p>
      </header>

      <HealthStatus />

      <footer className="text-sm text-muted">
        Documentação da API:{" "}
        <a
          href="/api/docs"
          className="inline-flex min-h-11 items-center font-medium text-primary underline"
        >
          /api/docs
        </a>
      </footer>
    </main>
  );
}
