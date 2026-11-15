/** Selo obrigatório em todo texto gerado por IA (ou pelo modelo de texto pronto). */
export function AiBadge({
  badge = "Gerado por IA · revise antes de usar",
  mode,
}: {
  badge?: string;
  mode?: "api" | "fallback";
}) {
  return (
    <p className="inline-flex w-fit flex-wrap items-center gap-2 rounded-full border-2 border-primary bg-surface px-3 py-1 text-xs font-bold text-primary">
      <span aria-hidden="true">✦</span>
      {badge}
      {mode && (
        <span className="font-medium text-muted">
          ({mode === "api" ? "Claude" : "modelo de texto pronto"})
        </span>
      )}
    </p>
  );
}
