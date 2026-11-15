import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.fn();
const loginAsVisitor = vi.fn();
const replace = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ status: "anonymous", login, loginAsVisitor, expired: false }),
}));

import { LoginForm } from "@/app/login/LoginForm";

describe("Formulário de login", () => {
  beforeEach(() => {
    login.mockReset();
    loginAsVisitor.mockReset();
    replace.mockReset();
  });

  it("valida campos vazios com mensagens em pt-BR e não chama a API", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Informe seu e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe sua senha.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("rejeita e-mail inválido", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "sem-arroba");
    await user.type(screen.getByLabelText("Senha"), "x");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText(/e-mail válido/)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("envia credenciais válidas e redireciona", async () => {
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "gestor@londrinalimpa.example");
    await user.type(screen.getByLabelText("Senha"), "segredo");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(login).toHaveBeenCalledWith("gestor@londrinalimpa.example", "segredo"));
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("mostra erro amigável quando o login falha", async () => {
    login.mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-mail"), "gestor@londrinalimpa.example");
    await user.type(screen.getByLabelText("Senha"), "errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("mostra o botão de visitante abaixo de Entrar, com a descrição", () => {
    render(<LoginForm />);
    const entrar = screen.getByRole("button", { name: "Entrar" });
    const visitante = screen.getByRole("button", { name: "Explorar como visitante" });
    expect(entrar.compareDocumentPosition(visitante) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      screen.getByText("Explore a Prevora em modo demonstração. Nenhuma alteração será salva."),
    ).toBeInTheDocument();
  });

  it("entra como visitante sem credenciais e vai ao painel", async () => {
    loginAsVisitor.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Explorar como visitante" }));
    await waitFor(() => expect(loginAsVisitor).toHaveBeenCalledTimes(1));
    expect(login).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("mostra erro amigável se a entrada de visitante falhar", async () => {
    loginAsVisitor.mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Explorar como visitante" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
