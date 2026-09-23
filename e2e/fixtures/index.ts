import fs from "node:fs";
import path from "node:path";
import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { env } from "../support/env";
import { MailosaurInbox, MailpitInbox, SmsInbox, type MailInbox } from "../support/inbox";
import { SeedApi, type Role, type Tenant } from "../support/seed";
import { signInOverHttp } from "./sessions";

const recordVideo = process.env.E2E_VIDEO === "on";
const VIDEO_SIZE = { width: 1280, height: 720 };

type WorkerFixtures = {
  tenant: Tenant;
  storageStates: Record<Role, string>;
};

type TestFixtures = {
  /** Who `page` is signed in as. Unset means a guest. Set per file or describe with `test.use({ role })`. */
  role: Role | undefined;
  /**
   * Opens another person's page, in its own browser context: a role of the same tenant, or
   * "guest" for someone with no session yet, such as a candidate opening their invitation.
   */
  pageAs: (who: Role | "guest") => Promise<Page>;
  /** Builds a path inside the worker's tenant: `org("/templates")` → `/o/<slug>/templates`. */
  org: (subpath?: string) => string;
  seed: SeedApi;
  mail: MailInbox;
  sms: SmsInbox;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Each worker seeds its own tenant, named after the run: parallel workers, shards and
  // concurrent runs against one UAT database never see each other's data.
  tenant: [
    async ({ playwright }, use, workerInfo) => {
      const api = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
      const tenant = await new SeedApi(api).tenant(`E2E ${env.runId} w${workerInfo.parallelIndex}`);
      await api.dispose();
      await use(tenant);
    },
    { scope: "worker" },
  ],

  // One signed-in session per role, created once per worker and reused by every test in it.
  storageStates: [
    async ({ playwright, tenant }, use, workerInfo) => {
      const dir = path.resolve(workerInfo.project.outputDir, ".auth");
      fs.mkdirSync(dir, { recursive: true });
      const states = {} as Record<Role, string>;
      for (const role of ["admin", "recruiter", "candidate"] as const) {
        const api = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
        await signInOverHttp(api, tenant, role);
        states[role] = path.join(dir, `${tenant.slug}-${role}.json`);
        await api.storageState({ path: states[role] });
        await api.dispose();
      }
      await use(states);
    },
    { scope: "worker" },
  ],

  role: [undefined, { option: true }],

  storageState: async ({ role, storageStates, storageState }, use) => {
    await use(role ? storageStates[role] : storageState);
  },

  pageAs: async ({ browser, storageStates }, use, testInfo) => {
    const contexts: BrowserContext[] = [];
    const videoStarts: Record<string, number> = {};
    await use(async (who) => {
      const name = `${contexts.length + 1}-${who}`;
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        storageState: who === "guest" ? undefined : storageStates[who],
        permissions: ["camera", "microphone"],
        ...(recordVideo ? { recordVideo: { dir: testInfo.outputPath(`video-${name}`), size: VIDEO_SIZE } } : {}),
      });
      videoStarts[name] = Date.now();
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((context) => context.close()));
    // scripts/demo-gif.sh lines the videos up on a shared clock with these start times.
    if (recordVideo) fs.writeFileSync(testInfo.outputPath("video-starts.json"), JSON.stringify(videoStarts));
  },

  org: async ({ tenant }, use) => {
    await use((subpath = "") => `/o/${tenant.slug}${subpath}`);
  },

  seed: async ({ request }, use) => {
    await use(new SeedApi(request));
  },

  mail: async ({ request }, use) => {
    await use(env.mailosaurApiKey && env.mailosaurServerId ? new MailosaurInbox(request) : new MailpitInbox(request));
  },

  sms: async ({ request }, use) => {
    await use(new SmsInbox(request));
  },
});

export { expect } from "@playwright/test";
