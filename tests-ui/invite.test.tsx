import { render, screen, within, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let role = "gestor";
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: () => <span />,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/convite",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/lib/useApi", () => ({
  useApi: () => ({ data: undefined, error: null, loading: false, stale: false }),
  clearApiCache: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: { id: "u", name: "Teste", email: "", role, job_title: "x" },
    consent: { accepted: true, required_version: "v", accepted_version: null, accepted_at: null },
    logout: vi.fn(),
  }),
}));

import { AppShell } from "@/components/AppShell";
import { InviteView, INVITE_URL } from "@/components/views/InviteView";

describe("Convite", () => {
  beforeEach(() => {
    role = "gestor";
  });

  it.each(["gestor", "admin"])("item Convite aparece logo abaixo de Meus dados para %s", (r) => {
    role = r;
    render(
      <AppShell>
        <p>x</p>
      </AppShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    const labels = within(nav)
      .getAllByRole("link")
      .map((a) => a.textContent);
    const i = labels.findIndex((t) => t?.includes("Meus dados"));
    expect(labels[i + 1]).toContain("Convite");
    expect(within(nav).getByRole("link", { name: /Convite/ })).toHaveAttribute("href", "/convite");
  });

  it("visitante não vê o item nem a página", () => {
    role = "visitante";
    render(
      <AppShell>
        <p>x</p>
      </AppShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(nav).queryByText("Convite")).toBeNull();
  });

  it("QR Code aponta para a URL correta e o modo apresentação sai com Esc", () => {
    render(<InviteView />);
    expect(INVITE_URL).toBe("https://londrina-limpa.vercel.app/login");
    expect(screen.getByRole("img", { name: /QR Code/ })).toHaveAttribute("data-qr-value", INVITE_URL);
    expect(screen.getByText(INVITE_URL)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agora é sua vez de explorar a Prevora!" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Modo apresentação" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Modo apresentação" }));
    fireEvent.click(screen.getByRole("button", { name: /Voltar/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
