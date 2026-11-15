import type { ReactNode } from "react";
import { Skeleton } from "@/components/States";
import { ShapeIcon, type Category } from "@/components/Shapes";

const TONE: Record<Category, string> = {
  alagamento: "var(--flood)",
  entulho: "var(--debris)",
  reincidente: "var(--critical)",
};

export function KpiCard({
  label,
  value,
  hint,
  category,
  loading = false,
  suffix,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  category?: Category;
  loading?: boolean;
  suffix?: string;
}) {
  return (
    <article className="card flex flex-col gap-1.5 p-4" aria-busy={loading}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted">
        {category && <ShapeIcon category={category} color={TONE[category]} />}
        {label}
      </h3>
      {loading ? (
        <Skeleton className="h-10 w-24" />
      ) : (
        <p className="font-display text-4xl font-bold leading-none">
          {value}
          {suffix && <span className="ml-1 text-xl font-semibold text-muted">{suffix}</span>}
        </p>
      )}
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </article>
  );
}
