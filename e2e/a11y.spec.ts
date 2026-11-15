import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { goTo, login } from "./helpers";

async function auditar(page: Page, nome: string) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const graves = r.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(
    graves.map(
      (v) => `${nome}: ${v.id} (${v.impact}) → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`,
    ),
  ).toEqual([]);
}

async function escuroDaltonico(page: Page) {
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.cb = "on";
  });
}

test.describe("Acessibilidade (axe: crítico/sério)", () => {
  test("login", async ({ page }) => {
    await page.goto("/login");
    await auditar(page, "login");
  });

  test("telas principais no tema claro", async ({ page }) => {
    await login(page);
    for (const rota of ["/", "/mapa", "/previsoes", "/pontos", "/conscientizacao", "/alertas"]) {
      await goTo(page, rota);
      await auditar(page, rota);
    }
  });

  test("tema escuro + Acessibilidade", async ({ page }) => {
    await login(page);
    for (const rota of ["/", "/previsoes", "/mapa"]) {
      await goTo(page, rota);
      await escuroDaltonico(page);
      await auditar(page, `${rota} (escuro+acessibilidade)`);
    }
  });
});
