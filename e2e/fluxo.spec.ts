import { expect, test } from "@playwright/test";
import { GESTOR, goTo, isMobile, login } from "./helpers";

test.describe("Fluxo principal da demo", () => {
  test("login → mapa → ponto reincidente → previsão → cartaz → previsões → logout", async ({ page }) => {
    await login(page);

    // Mapa e alertas
    await goTo(page, "/mapa");
    await expect(page.getByRole("heading", { name: /Mapa e alertas/ }).first()).toBeVisible();
    await expect(page.getByText(/Dados simulados/i).first()).toBeVisible();

    // Ponto reincidente
    await goTo(page, "/pontos");
    await expect(page.getByRole("heading", { name: "Pontos reincidentes" })).toBeVisible();
    const primeiro = page.locator('a[href^="/pontos/D-"]').first();
    await expect(primeiro).toBeVisible();
    await primeiro.click();
    await expect(page).toHaveURL(/\/pontos\/D-\d+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Previsão de reaparecimento
    await expect(page.getByText(/próximo acúmulo/i).first()).toBeVisible();

    // Gerar materiais → cartaz (modo fallback, sem chave de API)
    await page.getByRole("link", { name: /Gerar materiais de conscientização/ }).click();
    await expect(page).toHaveURL(/conscientizacao/);
    await expect(page.getByRole("tab", { name: "Cartaz" })).toBeVisible();
    await expect(page.getByText(/Gerado por IA/i).first()).toBeVisible();
    await expect(page.getByLabel(/Prévia do cartaz A4/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Baixar PDF/ })).toBeVisible();

    // Previsões e resultados
    await goTo(page, "/previsoes");
    await expect(page.getByRole("heading", { name: "Previsões e resultados" })).toBeVisible();
    await expect(page.getByText(/34/).first()).toBeVisible();
    await expect(page.getByText(/1\.240/).first()).toBeVisible();

    // Logout
    if (isMobile(page)) await page.getByRole("button", { name: "Mais" }).click();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/mapa");
    await expect(page).toHaveURL(/\/login/);
  });

  test("senha errada mostra erro amigável", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(GESTOR.email);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("rota protegida sem sessão volta ao login", async ({ page }) => {
    await page.goto("/previsoes");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Resiliência (fallbacks)", () => {
  test("IA fora do ar: a tela de previsões continua útil", async ({ page }) => {
    await login(page);
    await page.route("**/api/ai/**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "internal_error", message: "Erro", request_id: "x" } }),
      }),
    );
    await goTo(page, "/previsoes");
    await expect(page.getByRole("heading", { name: "Previsões e resultados" })).toBeVisible();
    await expect(page.getByText(/1\.240/).first()).toBeVisible();
    await expect(page.getByText(/Application error|Unhandled/i)).toHaveCount(0);
  });

  test("tiles do mapa indisponíveis: aviso e visão em lista", async ({ page }) => {
    await login(page);
    await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
    await goTo(page, "/mapa");
    await expect(page.getByText(/não carreg|não foi possível carregar|visão em lista|lista/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("sem internet: mostra a faixa offline", async ({ page, context }) => {
    await login(page);
    await goTo(page, "/");
    await context.setOffline(true);
    await expect(page.getByText(/offline|sem conexão|sem internet/i).first()).toBeVisible();
    await context.setOffline(false);
  });
});
