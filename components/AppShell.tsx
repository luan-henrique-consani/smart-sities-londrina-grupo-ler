"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { ROLE_LABEL } from "@/lib/format";
import type { Alert, Page, Role } from "@/lib/types";
import { Logo } from "@/components/Logo";
import {
  IconBell,
  IconChart,
  IconDashboard,
  IconLogout,
  IconMap,
  IconMegaphone,
  IconMore,
  IconRepeat,
  IconShield,
} from "@/components/icons";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PrefsButtons } from "@/components/PrefsButtons";
import { StatusBadges } from "@/components/StatusBadges";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/States";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  soon?: boolean;
  roles?: Role[];
};

const NAV: NavItem[] = [
  { href: "/", label: "Painel", Icon: IconDashboard },
  { href: "/mapa", label: "Mapa e alertas", Icon: IconMap },
  { href: "/alertas", label: "Alertas", Icon: IconBell },
  { href: "/previsoes", label: "Previsões e resultados", Icon: IconChart, soon: true },
  { href: "/pontos", label: "Pontos reincidentes", Icon: IconRepeat, soon: true },
  { href: "/conscientizacao", label: "Conscientização", Icon: IconMegaphone, soon: true },
  { href: "/saude", label: "Saúde do sistema", Icon: IconShield, roles: ["admin"] },
];

/** Itens fixos da barra inferior no celular (os demais ficam em "Mais"). */
const BOTTOM_HREFS = ["/", "/mapa", "/alertas", "/pontos"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function AlertBell() {
  const { data } = useApi<Page<Alert>>("/api/alerts?page_size=200");
  const urgent = data?.items.filter((a) => a.severity === "critical" || a.severity === "high").length;
  const total = data?.total;
  const label =
    total === undefined
      ? "Alertas"
      : `Alertas: ${urgent ?? 0} urgentes de ${total} ativos`;
  return (
    <Link
      href="/alertas"
      aria-label={label}
      title={label}
      className="relative inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-surface-2"
    >
      <IconBell />
      {urgent !== undefined && urgent > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-critical px-1 text-[0.7rem] font-bold text-white ring-2 ring-background"
        >
          {urgent}
        </span>
      )}
    </Link>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.95rem] font-medium ${
        active
          ? "bg-primary-soft text-foreground ring-1 ring-primary"
          : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      <item.Icon />
      <span className="flex-1">{item.label}</span>
      {item.soon && (
        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
          em breve
        </span>
      )}
    </Link>
  );
}

function UserBox({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="border-t border-border pt-3">
      <p className="truncate text-sm font-semibold">{user.name}</p>
      <p className="truncate text-xs text-muted">
        {ROLE_LABEL[user.role]} · {user.job_title}
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2"
      >
        <IconLogout size={18} />
        Sair
      </button>
    </div>
  );
}

function MoreSheet({
  items,
  pathname,
  onLogout,
  onClose,
}: {
  items: NavItem[];
  pathname: string;
  onLogout: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      id="mais-menu"
      role="dialog"
      aria-label="Mais opções"
      className="card fixed inset-x-3 bottom-[4.75rem] z-40 flex flex-col gap-1 p-3 md:hidden"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium hover:bg-surface-2"
        >
          <item.Icon />
          {item.label}
          {item.soon && <span className="text-xs text-muted">(em breve)</span>}
        </Link>
      ))}
      <UserBox onLogout={onLogout} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreForPath, setMoreForPath] = useState(pathname);

  // Fecha o menu "Mais" ao trocar de rota (ajuste de estado durante a renderização).
  if (moreForPath !== pathname) {
    setMoreForPath(pathname);
    setMoreOpen(false);
  }

  // Proteção de rota: sem sessão válida, vai para o login lembrando o destino.
  useEffect(() => {
    if (status === "anonymous") {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center p-6">
        <span className="sr-only">Verificando sua sessão…</span>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const visible = NAV.filter((item) => !item.roles || item.roles.includes(user.role));
  const bottom = visible.filter((item) => BOTTOM_HREFS.includes(item.href));
  const more = visible.filter((item) => !BOTTOM_HREFS.includes(item.href));

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[17rem_1fr]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:font-semibold focus:text-on-primary"
      >
        Ir para o conteúdo
      </a>

      {/* Barra lateral (tablet e computador) */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-4 border-r border-border bg-surface p-4 md:flex">
        <Link href="/" aria-label="Prevora — ir para o painel" className="rounded-lg py-1">
          <Logo />
        </Link>
        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {visible.map((item) => (
            <SidebarLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <UserBox onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <OfflineBanner />
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur md:px-6">
          <div className="md:hidden">
            <Link href="/" aria-label="Prevora — ir para o painel" className="rounded-lg">
              <Logo compact />
            </Link>
          </div>
          <StatusBadges className="order-last w-full md:order-none md:w-auto" />
          <div className="ml-auto flex items-center gap-2">
            <AlertBell />
            <PrefsButtons />
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 px-4 py-5 pb-28 outline-none md:px-6 md:pb-10">
          <ErrorBoundary component="AppShell.main">{children}</ErrorBoundary>
        </main>

        <footer className="hidden border-t border-border px-6 py-3 text-xs text-muted md:block">
          Prevora · gestão preventiva de resíduos e alagamentos de Londrina (PR) · dados simulados,
          coordenadas aproximadas.
        </footer>
      </div>

      {/* Barra inferior (celular) */}
      <nav
        aria-label="Navegação principal (celular)"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {bottom.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.7rem] font-semibold ${
                active ? "text-primary" : "text-muted"
              }`}
            >
              <item.Icon />
              <span className="max-w-full truncate">{item.label.replace("Mapa e alertas", "Mapa")}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="mais-menu"
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.7rem] font-semibold ${
            moreOpen ? "text-primary" : "text-muted"
          }`}
        >
          <IconMore />
          Mais
        </button>
      </nav>
      {moreOpen && (
        <MoreSheet
          items={more}
          pathname={pathname}
          onLogout={handleLogout}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </div>
  );
}

