import { test, expect } from "../../fixtures";

test.describe("staff sign-in", () => {
  test("a recruiter signs in with email and password", async ({ page, org, tenant }) => {
    const recruiter = tenant.users.recruiter;
    await page.goto(org("/login"));
    await page.getByLabel("Email", { exact: true }).fill(recruiter.email);
    await page.getByLabel("Password").fill(recruiter.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByTestId("current-user")).toHaveText(`${recruiter.name} (recruiter)`);
  });

  test("a wrong password is rejected", async ({ page, org, tenant }) => {
    await page.goto(org("/login"));
    await page.getByLabel("Email", { exact: true }).fill(tenant.users.admin.email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toHaveText("Wrong email or password.");
  });

  test("candidates cannot use the password form", async ({ page, org, tenant }) => {
    const candidate = tenant.users.candidate;
    await page.goto(org("/login"));
    await page.getByLabel("Email", { exact: true }).fill(candidate.email);
    await page.getByLabel("Password").fill(candidate.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toHaveText("Wrong email or password.");
  });

  test("a guest is sent to the sign-in page", async ({ page, org }) => {
    await page.goto(org("/invitations"));
    await expect(page).toHaveURL(org("/login"));
    await expect(page.getByRole("heading", { name: /^Sign in to/ })).toBeVisible();
  });

  test.describe("signed in", () => {
    test.use({ role: "admin" });

    test("signing out ends the session", async ({ page, org }) => {
      await page.goto(org());
      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page.getByRole("status")).toHaveText("You have been signed out.");

      await page.goto(org("/templates"));
      await expect(page).toHaveURL(org("/login"));
    });
  });
});
