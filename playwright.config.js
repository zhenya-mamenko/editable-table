import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 5179);
const vite = "npx vite --config tests/e2e/vite.config.js";

// End-to-end tests are run in the installed Google Chrome by default.
// Set PW_CHANNEL=chromium to use the browser of Playwright (npx playwright install chromium).
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.js",
  outputDir: "tests/e2e/results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    channel: process.env.PW_CHANNEL ?? "chrome",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `${vite} build && ${vite} preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
