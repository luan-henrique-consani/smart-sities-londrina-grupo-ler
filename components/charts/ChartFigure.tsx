"use client";

import type { ReactNode } from "react";

export type TableData = { caption: string; headers: string[]; rows: (string | number)[][] };

/**
 * Figura acessível: gráfico (descrito por texto) + tabela alternativa sempre disponível.
 */
export function ChartFigure({
  id,
  title,
  description,
  table,
  children,
}: {
  id: string;
  title: string;
  description: string;
  table: TableData;
  children: ReactNode;
}) {
  return (
    <figure className="card flex flex-col gap-3 p-4" aria-labelledby={`${id}-t`}>
      <figcaption>
        <h3 id={`${id}-t`} className="font-display text-lg font-semibold">
          {title}
        </h3>
        <p className="text-sm text-muted">{description}</p>
      </figcaption>
      <div role="img" aria-label={`${title}. ${description}`} className="h-64 w-full">
        {children}
      </div>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-primary">
          Ver os dados em tabela
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left">
            <caption className="sr-only">{table.caption}</caption>
            <thead className="border-y border-border text-muted">
              <tr>
                {table.headers.map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr key={String(r[0])} className="border-b border-border last:border-0">
                  {r.map((c, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="px-3 py-2 font-medium">
                        {c}
                      </th>
                    ) : (
                      <td key={i} className="px-3 py-2">
                        {typeof c === "number" ? c.toLocaleString("pt-BR") : c}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
