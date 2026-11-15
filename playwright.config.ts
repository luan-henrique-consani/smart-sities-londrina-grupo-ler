import { defineConfig, devices } from "@playwright/test";

/**
 * E2E em dois tamanhos: desktop (1440) e celular (390).
 * Por padrão sobe `npm run dev` (Next + uvicorn). Para testar uma URL já publicada:
 *   E2E_BASE_URL=https://londrina-limpa.vercel.app npx playwright test
 */
const external = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: external ?? "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "pt-BR",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "celular", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: external
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000/api/health",
        reuseExistingServer: true,
        timeout: 180_000,
        env: { COOKIE_SECURE: "false" },
      },
});
