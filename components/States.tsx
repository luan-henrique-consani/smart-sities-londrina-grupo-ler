import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { IconAlert } from "@/components/icons";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Placeholder de carregamento com texto para leitores de tela. */
export function LoadingBlock({ label = "Carregando dados…", className = "h-40" }: {
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className={`w-full ${className}`} />
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Não foi possível carregar",
}: {
  error?: ApiError | Error | null;
  onRetry?: () => void;
  title?: string;
}) {
  const requestId = error instanceof ApiError ? error.requestId : null;
  return (
    <div
      role="alert"
      className="card flex flex-col items-start gap-3 border-critical p-5"
    >
      <div className="flex items-center gap-2 font-display text-lg font-semibold text-critical">
        <IconAlert />
        {title}
      </div>
      <p className="text-foreground">
        {error?.message ?? "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      {requestId && (
        <p className="text-xs text-muted">Código de suporte: {requestId}</p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card p-6 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <p className="mt-1 text-muted">{children}</p>}
    </div>
  );
}

export function StaleNotice() {
  return (
    <p role="status" className="rounded-lg border border-debris bg-surface px-3 py-2 text-sm text-debris">
      Sem conexão: exibindo os últimos dados salvos neste aparelho.
    </p>
  );
}
