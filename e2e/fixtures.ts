import { test as base } from "@playwright/test";
import { Mailpit } from "./support/mailpit";

export const test = base.extend<{ mailpit: Mailpit }>({
  mailpit: async ({ request }, use) => {
    await use(new Mailpit(request));
  },
});

export { expect } from "@playwright/test";
