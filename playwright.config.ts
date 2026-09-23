import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
export const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["blob"], ["github"]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // A throwaway database per run: the suite never depends on leftovers from a previous one.
    command: "rm -f data/e2e.db* && tsx src/server.ts",
    url: `${BASE_URL}/health`,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: String(PORT),
      APP_URL: BASE_URL,
      DATABASE_PATH: "data/e2e.db",
      ENABLE_TEST_API: "1",
    },
  },
});
