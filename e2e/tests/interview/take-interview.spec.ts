import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";

test.use({ role: "candidate" });

test.describe("taking an interview", () => {
  test("records an answer per question with the camera and submits", async ({ page, context, org, seed, tenant, pageAs }) => {
    await context.grantPermissions(["camera", "microphone"]);
    const title = unique.name("QA Engineer");
    await seed.record(tenant.slug, "invitation", {
      attributes: { candidate_email: tenant.users.candidate.email, template_title: title },
    });

    await page.goto(org("/my/interviews"));
    await page.getByRole("link", { name: `Open ${title}` }).click();
    await expect(page.getByRole("button", { name: "Submit interview" })).toBeDisabled();

    await page.getByRole("button", { name: "Turn on camera and microphone" }).click();
    await expect(page.locator("#device-status")).toHaveText(/^Camera and microphone ready \(fake_device_0.*\)\.$/);
    // The fake camera paints real frames: the preview has a size only once video is flowing.
    await expect.poll(() => page.getByLabel("Camera preview").evaluate((video: HTMLVideoElement) => video.videoWidth)).toBeGreaterThan(0);

    for (const n of [1, 2]) {
      await page.getByRole("button", { name: `Record answer ${n}` }).click();
      await expect(page.getByRole("status", { name: `Answer ${n} status` })).toHaveText("Recording…");
      await page.getByRole("button", { name: `Stop answer ${n}` }).click();
      await expect(page.getByRole("status", { name: `Answer ${n} status` })).toHaveText("Answer saved");
    }

    await page.getByRole("button", { name: "Submit interview" }).click();
    await expect(page.getByRole("status")).toHaveText("Thank you! Your interview was submitted.");
    await expect(page.getByRole("row", { name: title })).toContainText("Completed");

    const recruiter = await pageAs("recruiter");
    await recruiter.goto(org(`/invitations?q=${encodeURIComponent(tenant.users.candidate.name)}&status=completed`));
    await expect(recruiter.getByRole("row", { name: title })).toContainText("Completed");
  });

  test("cannot submit before every question is answered", async ({ page, org, seed, tenant }) => {
    const title = unique.name("Half done");
    const invitation = await seed.record<{ id: number }>(tenant.slug, "invitation", {
      attributes: { candidate_email: tenant.users.candidate.email, template_title: title },
    });
    await page.goto(org(`/my/interviews/${invitation.id}`));
    await expect(page.getByRole("button", { name: "Submit interview" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Record answer 1" })).toBeDisabled();
  });

  test("never shows another candidate's interview", async ({ page, org, seed, tenant }) => {
    const someoneElse = await seed.record<{ id: number }>(tenant.slug, "invitation");
    const response = await page.goto(org(`/my/interviews/${someoneElse.id}`));
    expect(response?.status()).toBe(404);
  });
});
