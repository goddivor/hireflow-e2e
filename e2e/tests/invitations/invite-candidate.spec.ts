import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";
import { extractCode, extractLink } from "../../support/inbox";

test.use({ role: "recruiter" });

test.describe("inviting a candidate", () => {
  test("the candidate follows the emailed link and confirms the texted code", async ({ page, org, seed, tenant, mail, sms, pageAs }) => {
    const template = await seed.record<{ title: string }>(tenant.slug, "interview_template", {
      attributes: { title: unique.name("Support Engineer") },
    });
    const candidate = { name: unique.name("Casey Candidate"), email: unique.email("casey"), phone: unique.phone() };

    await page.goto(org("/invitations/new"));
    await page.getByLabel("Candidate name").fill(candidate.name);
    await page.getByLabel("Candidate email").fill(candidate.email);
    await page.getByLabel("Candidate phone").fill(candidate.phone);
    await page.getByLabel("Interview template").selectOption({ label: template.title });
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect(page.getByRole("status")).toHaveText(`Invitation sent to ${candidate.email}.`);
    await expect(page.getByRole("row", { name: candidate.name })).toContainText("Pending");

    const invitation = await mail.latest(candidate.email, /invited you to an interview/);
    expect(invitation.text).toContain(`"${template.title}" interview`);

    const candidatePage = await pageAs("guest");
    await candidatePage.goto(extractLink(invitation.text, "/magic/"));
    await expect(candidatePage.getByRole("heading", { name: "Confirm your phone" })).toBeVisible();
    await expect(candidatePage.getByText(`ending in ${candidate.phone.slice(-4)}`)).toBeVisible();

    const text = await sms.latest(candidate.phone);
    await candidatePage.getByLabel("Code from the text message").fill(extractCode(text.body));
    await candidatePage.getByRole("button", { name: "Confirm" }).click();

    await expect(candidatePage.getByRole("heading", { name: template.title })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("row", { name: candidate.name })).toContainText("Opened");
  });

  test("the form lists what is missing", async ({ page, org, seed, tenant }) => {
    await seed.record(tenant.slug, "interview_template");
    await page.goto(org("/invitations/new"));
    await page.getByRole("button", { name: "Send invitation" }).click();

    await expect(page.getByRole("alert")).toContainText("Name can't be blank");
    await expect(page.getByRole("alert")).toContainText("Phone can't be blank");
  });
});
