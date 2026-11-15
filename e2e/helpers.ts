import { expect, type Page } from "@playwright/test";

export const GESTOR = { email: "gestor@londrinalimpa.example", senha: "Limpa-Gestor-2026" };
export const ADMIN = { email: "admin@londrinalimpa.example", senha: "Limpa-Admin-2026" };

/** Login pela interface; aceita o Termo de Consentimento se ele aparecer. */
export async function login(page: Page, who = GESTOR) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(who.email);
  await page.getByLabel("Senha").fill(who.senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  const termo = page.getByRole("heading", { name: "Termo de Consentimento" });
  const painel = page.locator("#conteudo");
  await expect(termo.or(painel)).toBeVisible();
  if (await termo.isVisible()) {
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /Aceitar|Concordo/ }).click();
  }
  await expect(painel).toBeVisible();
}

export function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1440) < 768;
}

export async function goTo(page: Page, href: string) {
  await page.goto(href);
  await expect(page.locator("#conteudo")).toBeVisible();
}
