import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IotVisionButton } from "@/components/IotVisionDialog";

describe("IotVisionButton", () => {
  it("mostra o botão, o selo de conceito e alterna as abas", async () => {
    render(<IotVisionButton />);
    expect(screen.getByRole("button", { name: /Visão futura: sensores IoT/ })).toBeTruthy();
    expect(screen.getByText("Conceito futuro — Não implementado")).toBeTruthy();
    expect(screen.getByText(/nível elevado não comprova entupimento/)).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: /Resíduos/, hidden: true }));
    expect(screen.getByText(/terrenos abertos/)).toBeTruthy();
  });
});
