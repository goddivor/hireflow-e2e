import { defineConfig, devices } from "@playwright/test";

// One id per run, inherited by every worker and shard, so tenants from concurrent runs against the
// same UAT database never collide. CI sets it to the workflow run id.
process.env.E2E_RUN_ID ??= Date.now().toString(36);

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? [["blob"], ["github"]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.E2E_VIDEO === "on" ? { mode: "on", size: { width: 1280, height: 720 } } : "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          // Chrome's fake capture devices: a synthetic camera pattern and a beeping microphone,
          // with the permission prompt auto-accepted, so the interview flow runs headless in CI.
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
  ],
});
