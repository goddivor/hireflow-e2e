import { test as setup, expect } from "@playwright/test";
import { seedVerifiedUser } from "./support/users";

const STORAGE_STATE = "e2e/.auth/user.json";

setup("log in the shared test account", async ({ page, request }) => {
  const user = await seedVerifiedUser(request, "e2e-user@taskflow.test");

  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Your tasks" })).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
