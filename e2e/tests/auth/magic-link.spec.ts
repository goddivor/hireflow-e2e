import { test, expect } from "../../fixtures";
import { extractLink } from "../../support/inbox";

test.describe("sign-in link by email", () => {
  test("a recruiter signs in by following the emailed link", async ({ page, org, tenant, mail }) => {
    const recruiter = tenant.users.recruiter;
    await page.goto(org("/login"));
    await page.getByLabel("Email for a sign-in link").fill(recruiter.email);
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    await expect(page.getByRole("status")).toHaveText("If that email belongs to an account, a sign-in link is on its way.");

    const email = await mail.latest(recruiter.email, /sign-in link/);
    await page.goto(extractLink(email.text, "/magic/"));

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByTestId("current-user")).toContainText(recruiter.name);
  });

  test("a link works only once", async ({ page, org, tenant, mail }) => {
    const admin = tenant.users.admin;
    await page.goto(org("/login"));
    await page.getByLabel("Email for a sign-in link").fill(admin.email);
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    const link = extractLink((await mail.latest(admin.email, /sign-in link/)).text, "/magic/");

    await page.goto(link);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();

    await page.goto(link);
    await expect(page.getByRole("heading", { name: "This link has expired" })).toBeVisible();
  });

  test("an unknown email gets the same answer", async ({ page, org }) => {
    await page.goto(org("/login"));
    await page.getByLabel("Email for a sign-in link").fill("nobody@hireflow.test");
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    await expect(page.getByRole("status")).toHaveText("If that email belongs to an account, a sign-in link is on its way.");
  });
});
