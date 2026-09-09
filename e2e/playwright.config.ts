import { defineConfig, devices } from "@playwright/test";

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3000";
const WEBAPP_URL = process.env.WEBAPP_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: WEBAPP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx tsx --env-file-if-exists=.env src/index.ts",
      cwd: "../server",
      url: `${SERVER_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      cwd: "../webapp",
      url: WEBAPP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
