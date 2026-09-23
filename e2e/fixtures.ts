import fs from "node:fs";
import path from "node:path";
import { test as base } from "@playwright/test";
import { Mailpit } from "./support/mailpit";
import { PASSWORD, seedVerifiedUser } from "./support/users";

type Account = { email: string; password: string };

/** Guest tests: no session, only the Mailpit client. */
export const test = base.extend<{ mailpit: Mailpit }>({
  mailpit: async ({ request }, use) => {
    await use(new Mailpit(request));
  },
});

/**
 * Logged-in tests. Every parallel worker owns one account and logs it in once; the saved
 * session is reused by every test that worker runs. A single shared account let tests see
 * each other's tasks, so counts and empty states failed as soon as the suite grew.
 */
export const userTest = test.extend<{ clearTasks: void }, { workerAccount: Account; workerStorageState: string }>({
  workerAccount: [
    async ({ playwright }, use, workerInfo) => {
      const api = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
      // parallelIndex, not workerIndex: it stays within 0..workers-1 when a worker restarts
      // after a failure, so the same account and state file are reused instead of piling up.
      const account = await seedVerifiedUser(api, `worker-${workerInfo.parallelIndex}@taskflow.test`, PASSWORD);
      await api.dispose();
      await use(account);
    },
    { scope: "worker" },
  ],

  workerStorageState: [
    async ({ playwright, workerAccount }, use, workerInfo) => {
      const file = path.resolve(workerInfo.project.outputDir, `.auth/worker-${workerInfo.parallelIndex}.json`);
      const api = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
      // Logging in over HTTP skips rendering the form; the UI login itself is covered by login.spec.ts.
      const response = await api.post("/login", { form: { email: workerAccount.email, password: workerAccount.password } });
      if (!response.url().endsWith("/tasks")) throw new Error(`login for ${workerAccount.email} landed on ${response.url()}`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await api.storageState({ path: file });
      await api.dispose();
      await use(file);
    },
    { scope: "worker" },
  ],

  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Tests in one worker run one after another on the same account, so each starts from an empty list.
  clearTasks: [
    async ({ request, workerAccount }, use) => {
      const response = await request.post("/__test__/tasks/clear", { data: { email: workerAccount.email } });
      if (response.status() !== 204) throw new Error(`clearing tasks failed: ${response.status()}`);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
