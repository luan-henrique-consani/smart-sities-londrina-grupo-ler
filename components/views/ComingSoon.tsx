import Link from "next/link";
import type { ReactNode } from "react";

/** Página provisória das telas da próxima fase (Fase 5). */
export function ComingSoon({
  title,
  children,
  items,
}: {
  title: string;
  children: ReactNode;
  items: string[];
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="w-fit rounded-full border-2 border-primary bg-surface px-3 py-1 text-xs font-bold text-primary">
        Em breve
      </p>
      <p className="text-muted">{children}</p>
      <ul className="card list-disc p-5 pl-9">
        {items.map((i) => (
          <li key={i} className="py-0.5">
            {i}
          </li>
        ))}
      </ul>
      <Link
        href="/mapa"
        className="inline-flex min-h-11 w-fit items-center rounded-lg bg-primary px-4 font-semibold text-on-primary"
      >
        Ir para o mapa e alertas
      </Link>
    </div>
  );
}
