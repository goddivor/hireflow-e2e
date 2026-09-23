import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";
import { extractLink } from "../../support/inbox";

test.use({ role: "admin" });

test.describe("team", () => {
  test("an admin adds a recruiter, who signs in from the welcome email", async ({ page, org, mail, browser }) => {
    const name = unique.name("Riley Recruiter");
    const email = unique.email("recruiter");

    await page.goto(org("/team"));
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Add recruiter" }).click();

    await expect(page.getByRole("status")).toHaveText(`${name} was added and will get a sign-in link by email.`);
    await expect(page.getByRole("row", { name: `${name} ${email} recruiter` })).toBeVisible();

    const welcome = await mail.latest(email, /added to/);
    // A fresh context: the new recruiter is someone else, on another machine, with no session.
    const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    const recruiterPage = await context.newPage();
    await recruiterPage.goto(extractLink(welcome.text, "/magic/"));
    await expect(recruiterPage.getByTestId("current-user")).toHaveText(`${name} (recruiter)`);
    await context.close();
  });

  test("an email already on the team is refused", async ({ page, org, tenant }) => {
    await page.goto(org("/team"));
    await page.getByLabel("Name").fill("Duplicate person");
    await page.getByLabel("Email").fill(tenant.users.recruiter.email);
    await page.getByRole("button", { name: "Add recruiter" }).click();

    await expect(page.getByRole("alert")).toHaveText("Email has already been taken");
  });
});
