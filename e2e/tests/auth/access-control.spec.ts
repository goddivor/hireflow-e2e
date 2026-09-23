import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";

test.describe("tenant isolation", () => {
  test.use({ role: "recruiter" });

  test("a session from one tenant is a guest in another", async ({ page, seed }) => {
    const other = await seed.tenant(unique.name("Other tenant"));
    await page.goto(`/o/${other.slug}/invitations`);
    await expect(page).toHaveURL(`/o/${other.slug}/login`);
  });

  test("another tenant's template id answers 404", async ({ page, org, seed }) => {
    const other = await seed.tenant(unique.name("Other tenant"));
    const foreign = await seed.record<{ id: number }>(other.slug, "interview_template");

    const response = await page.goto(org(`/templates/${foreign.id}/edit`));
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});

test.describe("roles", () => {
  test.describe("recruiter", () => {
    test.use({ role: "recruiter" });

    test("cannot open the team page", async ({ page, org }) => {
      const response = await page.goto(org("/team"));
      expect(response?.status()).toBe(403);
      await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Team" })).toHaveCount(0);
    });
  });

  test.describe("candidate", () => {
    test.use({ role: "candidate" });

    test("cannot open recruiter pages", async ({ page, org }) => {
      for (const path of ["/templates", "/invitations", "/team"]) {
        const response = await page.goto(org(path));
        expect(response?.status(), path).toBe(403);
      }
    });

    test("lands on their own interviews", async ({ page, org }) => {
      await page.goto(org());
      await expect(page.getByRole("heading", { name: "My interviews" })).toBeVisible();
    });
  });
});
