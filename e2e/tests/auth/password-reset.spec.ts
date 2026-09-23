import { test, expect } from "../../fixtures";
import { extractLink } from "../../support/mailpit";
import { seedVerifiedUser, uniqueEmail } from "../../support/users";

test.describe("password reset by email link", () => {
  test("follows the emailed link and logs in with the new password", async ({ page, request, mailpit }) => {
    const user = await seedVerifiedUser(request, uniqueEmail("reset"));

    await page.goto("/forgot");
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("reset link is on its way");

    const link = extractLink(await mailpit.latestFor(user.email));
    expect(link).toContain("/reset?token=");
    await page.goto(link);

    await page.getByLabel("New password").fill("a-brand-new-password");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByRole("status")).toHaveText("Password updated. You can log in now.");

    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill("a-brand-new-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByTestId("current-user")).toHaveText(user.email);
  });

  test("accepts each reset link only once", async ({ page, request, mailpit }) => {
    const user = await seedVerifiedUser(request, uniqueEmail("reset-once"));
    await page.goto("/forgot");
    await page.getByLabel("Email").fill(user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();

    const link = extractLink(await mailpit.latestFor(user.email));
    for (const password of ["first-new-password", "second-new-password"]) {
      await page.goto(link);
      await page.getByLabel("New password").fill(password);
      await page.getByRole("button", { name: "Update password" }).click();
    }

    await expect(page.getByRole("alert")).toHaveText("This reset link is invalid or has expired.");
  });

  test("gives the same answer for an unknown email", async ({ page }) => {
    await page.goto("/forgot");
    await page.getByLabel("Email").fill(uniqueEmail("nobody"));
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toHaveText("If an account exists for that email, a reset link is on its way.");
  });
});
