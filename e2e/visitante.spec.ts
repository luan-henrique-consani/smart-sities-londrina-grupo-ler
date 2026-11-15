import { expect, test } from "@playwright/test";
import { goTo, isMobile } from "./helpers";

test.describe("Modo Visitante", () => {
  test("login → explorar como visitante → painel → mapa → filtros → ponto → previsões → logout", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(
      page.getByText("Explore a Prevora em modo demonstração. Nenhuma alteração será salva."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Explorar como visitante" }).click();

    // Painel (sem credenciais, sem Termo de Consentimento)
    await expect(page.locator("#conteudo")).toBeVisible();
    await expect(page.getByText("Modo Visitante").first()).toBeVisible();
    await expect(page.getByText(/Dados simulados/i).first()).toBeVisible();

    // Sem os itens proibidos no menu
    if (isMobile(page)) await page.getByRole("button", { name: "Mais" }).click();
    await expect(page.getByRole("link", { name: "Conscientização" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Meus dados" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Saúde do sistema" })).toHaveCount(0);
    if (isMobile(page)) await page.keyboard.press("Escape");

    // Mapa e filtros
    await goTo(page, "/mapa");
    await expect(page.getByRole("heading", { name: /Mapa e alertas/ }).first()).toBeVisible();
    const filtro = page.getByRole("button", { name: /72 ?h/ }).first();
    if (await filtro.isVisible().catch(() => false)) await filtro.click();

    // Ponto reincidente (sem botões de escrita)
    await goTo(page, "/pontos");
    const primeiro = page.locator('a[href^="/pontos/D-"]').first();
    await expect(primeiro).toBeVisible();
    await primeiro.click();
    await expect(page).toHaveURL(/\/pontos\/D-\d+/);
    await expect(page.getByText(/próximo acúmulo/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Registrar decisão/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Gerar materiais de conscientização/ })).toHaveCount(0);

    // Previsões
    await goTo(page, "/previsoes");
    await expect(page.getByRole("heading", { name: "Previsões e resultados" })).toBeVisible();

    // Rotas restritas pela URL
    for (const rota of ["/conscientizacao", "/meus-dados", "/saude"]) {
      await page.goto(rota);
      await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
    }
    await page.getByRole("link", { name: "Voltar ao painel" }).click();
    await expect(page).toHaveURL(/\/$/);

    // Backend também recusa (independe da interface)
    const res = await page.request.get("/api/privacy/my-data");
    expect(res.status()).toBe(403);

    // Logout
    if (isMobile(page)) await page.getByRole("button", { name: "Mais" }).click();
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/mapa");
    await expect(page).toHaveURL(/\/login/);
  });
});
