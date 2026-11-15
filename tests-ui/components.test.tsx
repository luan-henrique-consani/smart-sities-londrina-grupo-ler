import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KpiCard } from "@/components/KpiCard";
import { AlertCard, SeverityTag } from "@/components/AlertList";
import { PrefsButtons } from "@/components/PrefsButtons";
import type { Alert } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const alerta: Alert = {
  id: "A-1",
  created_at: "2026-11-15T07:00:00-03:00",
  type: "flood_risk",
  severity: "critical",
  title: "Risco alto no Lago Igapó",
  message: "Chuva forte prevista para as próximas 72 h.",
  point_id: null,
  area_id: null,
  flood_area_id: "F-01",
  horizon: "72h",
  score: 87,
  suggestions: null,
  starts_on: null,
  ends_on: null,
};

describe("KpiCard", () => {
  it("mostra rótulo, valor, sufixo e dica", () => {
    render(<KpiCard label="Reincidência" value="−34" suffix="%" hint="com o plano" category="reincidente" />);
    expect(screen.getByRole("heading", { name: /Reincidência/ })).toBeInTheDocument();
    expect(screen.getByText("−34")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("com o plano")).toBeInTheDocument();
  });

  it("em carregamento esconde o valor e marca aria-busy", () => {
    const { container } = render(<KpiCard label="Dias limpo" value="11" loading />);
    expect(screen.queryByText("11")).not.toBeInTheDocument();
    expect(container.querySelector("article")).toHaveAttribute("aria-busy", "true");
  });
});

describe("AlertCard", () => {
  it("mostra gravidade em texto (não só cor), risco e horizonte", () => {
    render(
      <ul>
        <AlertCard alert={alerta} />
      </ul>,
    );
    expect(screen.getByText("Risco alto no Lago Igapó")).toBeInTheDocument();
    expect(screen.getByText(/Risco 87\/100/)).toBeInTheDocument();
    expect(screen.getByText(/Crítico/i)).toBeInTheDocument();
  });

  it("SeverityTag cai no estilo informativo para gravidade desconhecida", () => {
    render(<SeverityTag severity="xyz" />);
    expect(screen.getByText("xyz")).toBeInTheDocument();
  });
});

describe("PrefsButtons (tema e Acessibilidade)", () => {
  it("alterna o tema escuro e persiste em localStorage", async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = "light";
    render(<PrefsButtons />);
    const btn = screen.getByRole("button", { name: /Tema claro ativado/ });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    await user.click(btn);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("prevora:theme")).toBe("dark");
    expect(screen.getByRole("button", { name: /Tema escuro ativado/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("liga e desliga o modo Acessibilidade", async () => {
    const user = userEvent.setup();
    render(<PrefsButtons />);
    const btn = screen.getByRole("button", { name: /Acessibilidade/ });
    await user.click(btn);
    expect(document.documentElement.dataset.cb).toBe("on");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    await user.click(btn);
    expect(document.documentElement.dataset.cb).toBeUndefined();
    expect(window.localStorage.getItem("prevora:daltonismo")).toBe("off");
  });

  it("funciona mesmo com localStorage bloqueado", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    render(<PrefsButtons />);
    await user.click(screen.getByRole("button", { name: /Acessibilidade/ }));
    expect(document.documentElement.dataset.cb).toBe("on");
    spy.mockRestore();
  });
});
