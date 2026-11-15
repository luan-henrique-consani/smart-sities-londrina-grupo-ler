"use client";

import { useApi } from "@/lib/useApi";
import { formatUpdatedAt } from "@/lib/format";
import type { Meta } from "@/lib/types";

/** Selos "Dados simulados" e "Atualizado às HH:MM" (horário de geração vindo de /api/meta). */
export function StatusBadges({ className = "" }: { className?: string }) {
  const { data } = useApi<Meta>("/api/meta");
  const updated = formatUpdatedAt(data?.generated_at);
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs font-semibold ${className}`}>
      <span className="rounded-full border-2 border-debris bg-surface px-2.5 py-1 text-debris">
        ◆ Dados simulados
      </span>
      {updated && (
        <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-muted">
          Atualizado às {updated}
        </span>
      )}
    </div>
  );
}
