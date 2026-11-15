import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const login = vi.fn();
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
  useAuth: () => ({ status: "anonymous", login, expired: false }),
}));

import { LoginForm } from "@/app/login/LoginForm";

describe("Formulário de login", () => {
  beforeEach(() => {
    login.mockReset();
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
});
