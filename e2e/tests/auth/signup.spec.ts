import { test, expect } from "../../fixtures";
import { extractCode } from "../../support/mailpit";
import { PASSWORD, uniqueEmail } from "../../support/users";

test.describe("signup with email verification", () => {
  test("verifies the account with the code sent by email", async ({ page, mailpit }) => {
    const email = uniqueEmail("signup");

    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();

    const message = await mailpit.latestFor(email);
    expect(message.Subject).toMatch(/^Your Taskflow code is \d{6}$/);
    const code = extractCode(message);

    await page.getByLabel("Verification code").fill(code);
    await page.getByRole("button", { name: "Verify" }).click();

    await expect(page.getByRole("heading", { name: "Your tasks" })).toBeVisible();
    await expect(page.getByTestId("current-user")).toHaveText(email);
  });

  test("rejects a wrong code", async ({ page, mailpit }) => {
    const email = uniqueEmail("wrong-code");
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    const real = extractCode(await mailpit.latestFor(email));
    const wrong = real === "000000" ? "111111" : "000000";
    await page.getByLabel("Verification code").fill(wrong);
    await page.getByRole("button", { name: "Verify" }).click();

    await expect(page.getByRole("alert")).toHaveText("That code is invalid or has expired.");
  });

  test("refuses to log in before the email is verified", async ({ page }) => {
    const email = uniqueEmail("unverified");
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("alert")).toHaveText("Confirm your email address before logging in.");
  });

  test("refuses a second account for the same email", async ({ page, request }) => {
    const email = uniqueEmail("duplicate");
    await request.post("/__test__/users", { data: { email, password: PASSWORD } });

    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("alert")).toHaveText("An account already exists for this email.");
  });
});
