import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { PrefsButtons } from "@/components/PrefsButtons";

/** Moldura das páginas públicas /privacidade e /termos (sem login). */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:font-semibold focus:text-on-primary"
      >
        Ir para o conteúdo
      </a>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:px-8">
        <Link href="/" aria-label="Prevora — ir para o início" className="rounded-lg">
          <Logo />
        </Link>
        <PrefsButtons />
      </header>
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-8 outline-none md:py-12">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          Versão {updated} · todos os dados da Prevora são simulados nesta demonstração.
        </p>
        <div className="mt-6 flex flex-col gap-6 leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
          {children}
        </div>
        <nav aria-label="Páginas legais" className="mt-10 flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
          <Link href="/privacidade" className="min-h-11 py-2 font-medium underline">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="min-h-11 py-2 font-medium underline">
            Termo de Consentimento
          </Link>
          <Link href="/login" className="min-h-11 py-2 font-medium underline">
            Entrar
          </Link>
        </nav>
      </main>
    </div>
  );
}
