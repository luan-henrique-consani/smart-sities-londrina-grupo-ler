import type { SVGProps } from "react";

/** Símbolo da Prevora: um "P" com linha de tendência (previsão) que sobe. */
export function LogoMark({ size = 36, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Símbolo da Prevora"
      {...props}
    >
      <defs>
        <linearGradient id="prevora-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0E6B60" />
          <stop offset="1" stopColor="#1D5A96" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#prevora-g)" />
      <path
        d="M13 30V11h8.2a5.6 5.6 0 0 1 0 11.2H13"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 31.5l4.2-5.2 3.3 3.1 5.2-7.4"
        fill="none"
        stroke="#9CF0D9"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34.2" cy="21.9" r="2" fill="#9CF0D9" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark aria-hidden="true" role="presentation" aria-label={undefined} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-[0.12em] text-foreground">
          PREVORA
        </span>
        {!compact && (
          <span className="mt-1 text-[0.68rem] font-medium tracking-wide text-muted">
            Inteligência preventiva urbana
          </span>
        )}
      </span>
    </span>
  );
}
