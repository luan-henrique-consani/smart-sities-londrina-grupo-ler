import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
const logout = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/lib/useApi", () => ({
  useApi: () => ({ data: undefined, error: null, loading: false, stale: false }),
  clearApiCache: vi.fn(),
}));

let role = "visitante";
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { id: "visitante-1", name: "Visitante", email: "", role, job_title: "Modo demonstração" },
    consent: { accepted: true, required_version: "v", accepted_version: null, accepted_at: null },
    logout,
  }),
}));

import { AppShell, visitorCanOpen } from "@/components/AppShell";

function renderShell() {
  return render(
    <AppShell>
      <p>conteúdo interno</p>
    </AppShell>,
  );
}

describe("Perfil visitante na interface", () => {
  beforeEach(() => {
    pathname = "/";
    role = "visitante";
    logout.mockReset();
  });

  it("libera só as rotas de leitura", () => {
    for (const ok of ["/", "/mapa", "/previsoes", "/pontos", "/pontos/D-0004", "/alertas"]) {
      expect(visitorCanOpen(ok)).toBe(true);
    }
    for (const no of ["/conscientizacao", "/meus-dados", "/saude", "/admin", "/mapas"]) {
      expect(visitorCanOpen(no)).toBe(false);
    }
  });

  it("esconde Conscientização, Meus dados e Saúde do sistema e mostra Modo Visitante", () => {
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByText("Mapa e alertas")).toBeInTheDocument();
    expect(within(nav).getByText("Pontos reincidentes")).toBeInTheDocument();
    expect(within(nav).queryByText("Conscientização")).toBeNull();
    expect(within(nav).queryByText("Meus dados")).toBeNull();
    expect(within(nav).queryByText("Saúde do sistema")).toBeNull();
    expect(screen.getByText("Modo Visitante")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sair" }).length).toBeGreaterThan(0);
    expect(screen.getByText("conteúdo interno")).toBeInTheDocument();
  });

  it.each(["/conscientizacao", "/meus-dados", "/saude"])(
    "rota proibida %s mostra Acesso restrito sem renderizar a página",
    (path) => {
      pathname = path;
      renderShell();
      expect(screen.getByRole("heading", { name: "Acesso restrito" })).toBeInTheDocument();
      expect(
        screen.getByText("Esta funcionalidade está disponível apenas para usuários autorizados da Prevora."),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Voltar ao painel" })).toHaveAttribute("href", "/");
      expect(screen.queryByText("conteúdo interno")).toBeNull();
    },
  );

  it("servidores continuam vendo Conscientização e Meus dados", () => {
    role = "gestor";
    renderShell();
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).getByText("Conscientização")).toBeInTheDocument();
    expect(within(nav).getByText("Meus dados")).toBeInTheDocument();
    expect(screen.queryByText("Modo Visitante")).toBeNull();
  });
});
