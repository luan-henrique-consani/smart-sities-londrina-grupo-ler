import Image from "next/image";

/**
 * Logo oficial da Prevora (public/prevora-logo.png, PNG com transparência, proporção 720×634).
 * Componente único de marca: sidebar, cabeçalho, login, páginas legais e de erro usam este arquivo.
 * No tema escuro, .logo-chip aplica um contorno claro fino (sem base branca) para manter o contraste do azul.
 */
const RATIO = 634 / 720;

export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`logo-chip inline-flex shrink-0 items-center justify-center ${className}`}>
      <Image
        src="/prevora-logo.png"
        alt=""
        aria-hidden="true"
        width={size}
        height={Math.round(size * RATIO)}
        unoptimized
        priority
        style={{ width: size, height: "auto" }}
      />
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={compact ? 38 : 44} />
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
