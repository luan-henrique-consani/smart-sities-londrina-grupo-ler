import type { RiskLevel } from "@/lib/types";
import { RISK_CLASS, RISK_LABEL } from "@/lib/format";

export type Category = "alagamento" | "entulho" | "reincidente";

export const CATEGORY_LABEL: Record<Category, string> = {
  alagamento: "Alagamento",
  entulho: "Entulho",
  reincidente: "Reincidente crônico",
};

export const CATEGORY_SHAPE_LABEL: Record<Category, string> = {
  alagamento: "círculo",
  entulho: "quadrado",
  reincidente: "losango",
};

/** Forma da categoria: círculo = alagamento, quadrado = entulho, losango = reincidente. */
export function ShapeIcon({
  category,
  size = 16,
  color,
}: {
  category: Category;
  size?: number;
  color?: string;
}) {
  const fill = color ?? "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {category === "alagamento" && <circle cx="8" cy="8" r="6" fill={fill} />}
      {category === "entulho" && <rect x="2" y="2" width="12" height="12" rx="1.5" fill={fill} />}
      {category === "reincidente" && <path d="M8 1 15 8 8 15 1 8Z" fill={fill} />}
    </svg>
  );
}

/** Categoria = só forma, em cor neutra do tema (a cor fica reservada à criticidade). */
export const NEUTRAL_SHAPE = "var(--shape-neutral)";

export function CategoryTag({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <ShapeIcon category={category} color={NEUTRAL_SHAPE} />
      {CATEGORY_LABEL[category]}
    </span>
  );
}

const RISK_STYLE: Record<RiskLevel, string> = {
  baixo: "border-risk-low text-risk-low",
  médio: "border-risk-mid text-risk-mid",
  alto: "border-risk-high text-risk-high",
};

/** Amostra de cor da criticidade (retângulo arredondado, para não ser confundida com as formas de categoria). */
export function RiskSwatch({ level }: { level: RiskLevel }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3.5 w-6 shrink-0 rounded-sm border border-[var(--marker-stroke)] shadow-[0_0_0_1px_var(--border)]"
      style={{ background: RISK_VAR[level] }}
    />
  );
}

const RISK_VAR: Record<RiskLevel, string> = {
  baixo: "var(--risk-low)",
  médio: "var(--risk-mid)",
  alto: "var(--risk-high)",
};

const RISK_MARK: Record<RiskLevel, string> = { baixo: "▽", médio: "◇", alto: "△" };

/** Criticidade com cor E texto E símbolo (nunca só cor). */
export function RiskBadge({ level, prefix = "Criticidade" }: { level: RiskLevel; prefix?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 bg-surface px-2.5 py-0.5 text-xs font-bold ${RISK_STYLE[level]}`}
    >
      <span aria-hidden="true">{RISK_MARK[level]}</span>
      <span>
        {prefix} {RISK_LABEL[level].toLowerCase()}
      </span>
    </span>
  );
}

export function riskClass(level: RiskLevel) {
  return RISK_CLASS[level];
}
