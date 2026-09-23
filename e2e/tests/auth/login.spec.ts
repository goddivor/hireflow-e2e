import { test, expect } from "../../fixtures";
import { seedVerifiedUser, uniqueEmail } from "../../support/users";

test.describe("login", () => {
  test("redirects a guest away from the task list", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("rejects a wrong password", async ({ page, request }) => {
    const user = await seedVerifiedUser(request, uniqueEmail("wrong-password"));
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Wrong email or password.");
  });

  test("logs in and out", async ({ page, request }) => {
    const user = await seedVerifiedUser(request, uniqueEmail("login"));
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByTestId("current-user")).toHaveText(user.email);

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/login$/);
  });
});
