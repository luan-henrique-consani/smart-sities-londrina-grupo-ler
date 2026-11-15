import type { RiskLevel } from "@/lib/types";
import { RISK_LABEL } from "@/lib/format";

const BG: Record<RiskLevel, string> = {
  alto: "bg-risk-high",
  médio: "bg-risk-mid",
  baixo: "bg-risk-low",
};
const MARK: Record<RiskLevel, string> = { alto: "△", médio: "◇", baixo: "▽" };
const ORDER: RiskLevel[] = ["alto", "médio", "baixo"];

/** Barra empilhada por criticidade, com rótulos de texto e descrição para leitores de tela. */
export function DistributionBar({
  title,
  counts,
  unit,
}: {
  title: string;
  counts: Record<RiskLevel, number>;
  unit: string;
}) {
  const total = ORDER.reduce((sum, l) => sum + counts[l], 0);
  const description = `${title}: ${ORDER.map((l) => `${counts[l]} de criticidade ${RISK_LABEL[l].toLowerCase()}`).join(", ")}. Total de ${total} ${unit}.`;
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-semibold">{title}</figcaption>
      <div
        role="img"
        aria-label={description}
        className="flex h-5 w-full overflow-hidden rounded-full bg-surface-2"
      >
        {total > 0 &&
          ORDER.map((l) =>
            counts[l] > 0 ? (
              <div key={l} className={BG[l]} style={{ width: `${(counts[l] / total) * 100}%`, minWidth: 6 }} />
            ) : null,
          )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {ORDER.map((l) => (
          <li key={l} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${BG[l]}`} />
            <span aria-hidden="true">{MARK[l]}</span>
            <span>
              {RISK_LABEL[l]}: <strong>{counts[l]}</strong>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
