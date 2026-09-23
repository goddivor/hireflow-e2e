import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";
import { extractCode } from "../../support/inbox";

// Candidates sign in with their magic link, then the code texted to them. Each test seeds its own
// tenant because a candidate's sign-in link works once, and the worker's link already signed them in.
test.describe("candidate phone verification", () => {
  test("the texted code signs the candidate in", async ({ page, seed, sms }) => {
    const tenant = await seed.tenant(unique.name("Phone check"));
    await page.goto(`/o/${tenant.slug}/magic/${tenant.candidate_sign_in_token}`);

    const text = await sms.latest(tenant.users.candidate.phone!);
    expect(text.body).toMatch(/^Your Hireflow code is \d{6}\. It expires in 10 minutes\.$/);
    await page.getByLabel("Code from the text message").fill(extractCode(text.body));
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByRole("heading", { name: "My interviews" })).toBeVisible();
  });

  test("a wrong code keeps the candidate out", async ({ page, seed, sms }) => {
    const tenant = await seed.tenant(unique.name("Wrong code"));
    await page.goto(`/o/${tenant.slug}/magic/${tenant.candidate_sign_in_token}`);

    const real = extractCode((await sms.latest(tenant.users.candidate.phone!)).body);
    await page.getByLabel("Code from the text message").fill(real === "000000" ? "111111" : "000000");
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByRole("alert")).toHaveText("That code is not valid. Check the latest text message and try again.");
    await page.goto(`/o/${tenant.slug}/my/interviews`);
    await expect(page).toHaveURL(`/o/${tenant.slug}/login`);
  });
});
