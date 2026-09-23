import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";
import { extractCode, extractLink } from "../../support/inbox";

// The critical path end to end, with two people on two browsers: a recruiter builds a template and
// invites a candidate; the candidate signs in from the email, confirms the texted code, answers on
// camera and submits; the recruiter sees the interview completed.
test("a candidate goes from invitation email to submitted interview", async ({ org, mail, sms, pageAs }) => {
  const title = unique.name("Platform Engineer");
  const candidate = { name: unique.name("Jordan Lee"), email: unique.email("jordan"), phone: unique.phone() };
  const recruiter = await pageAs("recruiter");

  await test.step("recruiter builds a two-question template", async () => {
    await recruiter.goto(org("/templates/new"));
    await recruiter.getByLabel("Title").fill(title);
    await recruiter.getByLabel("Question 1", { exact: true }).fill("Walk us through a system you designed.");
    await recruiter.getByRole("button", { name: "Add question" }).click();
    await recruiter.getByLabel("Question 2", { exact: true }).fill("How do you make a test suite trustworthy?");
    await recruiter.getByRole("button", { name: "Create template" }).click();
    await expect(recruiter.getByRole("status")).toHaveText(`Template "${title}" was created.`);
  });

  await test.step("recruiter invites the candidate", async () => {
    await recruiter.getByRole("link", { name: "Invitations" }).click();
    await recruiter.getByRole("link", { name: "Invite a candidate" }).click();
    await recruiter.getByLabel("Candidate name").fill(candidate.name);
    await recruiter.getByLabel("Candidate email").fill(candidate.email);
    await recruiter.getByLabel("Candidate phone").fill(candidate.phone);
    await recruiter.getByLabel("Interview template").selectOption({ label: title });
    await recruiter.getByRole("button", { name: "Send invitation" }).click();
    await expect(recruiter.getByRole("row", { name: candidate.name })).toContainText("Pending");
  });

  const candidatePage = await pageAs("guest");

  await test.step("candidate opens the emailed link and confirms the texted code", async () => {
    const invitation = await mail.latest(candidate.email, /invited you to an interview/);
    await candidatePage.goto(extractLink(invitation.text, "/magic/"));
    await expect(candidatePage.getByRole("heading", { name: "Confirm your phone" })).toBeVisible();

    const text = await sms.latest(candidate.phone);
    await candidatePage.getByLabel("Code from the text message").fill(extractCode(text.body));
    await candidatePage.getByRole("button", { name: "Confirm" }).click();
    await expect(candidatePage.getByRole("heading", { name: title })).toBeVisible();
  });

  await test.step("candidate answers both questions on camera and submits", async () => {
    await candidatePage.getByRole("button", { name: "Turn on camera and microphone" }).click();
    await expect(candidatePage.getByRole("status", { name: "Device status" })).toContainText("Camera and microphone ready");

    for (const n of [1, 2]) {
      await candidatePage.getByRole("button", { name: `Record answer ${n}` }).click();
      await expect(candidatePage.getByRole("status", { name: `Answer ${n} status` })).toHaveText("Recording…");
      await candidatePage.getByRole("button", { name: `Stop answer ${n}` }).click();
      await expect(candidatePage.getByRole("status", { name: `Answer ${n} status` })).toHaveText("Answer saved");
    }
    await candidatePage.getByRole("button", { name: "Submit interview" }).click();
    await expect(candidatePage.getByRole("status")).toHaveText("Thank you! Your interview was submitted.");
  });

  await test.step("recruiter sees the interview completed", async () => {
    await recruiter.reload();
    await expect(recruiter.getByRole("row", { name: candidate.name })).toContainText("Completed");
  });
});
