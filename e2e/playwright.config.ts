import { defineConfig, devices } from "@playwright/test";
import { E2E_SERVER_URL, E2E_WEBAPP_URL, e2eDatabaseUrl } from "./env";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: E2E_WEBAPP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "npx tsx --env-file-if-exists=.env src/index.ts",
      cwd: "../server",
      url: `${E2E_SERVER_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        ...(process.env as Record<string, string>),
        DATABASE_URL: e2eDatabaseUrl(),
        PORT: "3100",
        SERVER_URL: E2E_SERVER_URL,
        WEBAPP_URL: E2E_WEBAPP_URL,
      },
    },
    {
      command: "npm run dev -- --port 5273 --strictPort",
      cwd: "../webapp",
      url: E2E_WEBAPP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        ...(process.env as Record<string, string>),
        VITE_SERVER_URL: E2E_SERVER_URL,
      },
    },
  ],
});
