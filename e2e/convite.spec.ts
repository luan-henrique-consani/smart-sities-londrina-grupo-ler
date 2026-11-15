import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("Convite: QR, modo apresentação e Esc", async ({ page }) => {
  await login(page);
  await page.goto("/convite");
  await expect(page.getByRole("heading", { name: "Agora é sua vez de explorar a Prevora!" })).toBeVisible();
  await expect(page.getByRole("img", { name: /QR Code/ })).toHaveAttribute(
    "data-qr-value",
    "https://londrina-limpa.vercel.app/login",
  );
  await page.getByRole("button", { name: "Modo apresentação" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Agora é sua vez de explorar a Prevora!" })).toBeVisible();
});
