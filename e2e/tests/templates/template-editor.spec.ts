import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";

test.use({ role: "recruiter" });

test.describe("template editor", () => {
  test("creates a template with several questions", async ({ page, org }) => {
    const title = unique.name("Frontend Engineer");
    await page.goto(org("/templates/new"));

    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Question 1", { exact: true }).fill("What does a good pull request look like?");
    await page.getByRole("button", { name: "Add question" }).click();
    await page.getByLabel("Question 2", { exact: true }).fill("How do you keep a test suite fast?");
    await page.getByRole("button", { name: "Add question" }).click();
    await page.getByLabel("Question 3", { exact: true }).fill("Tell us about a bug you shipped.");
    await page.getByRole("button", { name: "Create template" }).click();

    await expect(page.getByRole("status")).toHaveText(`Template "${title}" was created.`);
    await expect(page.getByRole("row", { name: title })).toContainText("3");
  });

  test("reorders and removes questions", async ({ page, org, seed, tenant }) => {
    const template = await seed.record<{ id: number; title: string }>(tenant.slug, "interview_template", {
      attributes: { title: unique.name("Data Analyst"), questions: ["First", "Second", "Third"] },
    });
    await page.goto(org(`/templates/${template.id}/edit`));

    await page.getByRole("button", { name: "Move question 3 up" }).click();
    await expect(page.getByLabel("Question 2", { exact: true })).toHaveValue("Third");
    await page.getByRole("button", { name: "Remove question 1" }).click();
    await expect(page.getByLabel("Question 1", { exact: true })).toHaveValue("Third");
    await page.getByRole("button", { name: "Save template" }).click();

    await expect(page.getByRole("status")).toHaveText(`Template "${template.title}" was updated.`);
    await page.getByRole("link", { name: `Edit ${template.title}` }).click();
    await expect(page.getByLabel("Question 1", { exact: true })).toHaveValue("Third");
    await expect(page.getByLabel("Question 2", { exact: true })).toHaveValue("Second");
    await expect(page.getByLabel("Question 3", { exact: true })).toHaveCount(0);
  });

  test("refuses a template without a title or questions", async ({ page, org }) => {
    await page.goto(org("/templates/new"));
    await page.getByRole("button", { name: "Create template" }).click();

    await expect(page.getByRole("alert")).toHaveText("Title can't be blank and Questions need at least one question");
  });

  test("deletes an unused template", async ({ page, org, seed, tenant }) => {
    const template = await seed.record<{ title: string }>(tenant.slug, "interview_template", {
      attributes: { title: unique.name("Obsolete role") },
    });
    await page.goto(org("/templates"));
    await page.getByRole("button", { name: `Delete ${template.title}` }).click();

    await expect(page.getByRole("status")).toHaveText(`Template "${template.title}" was deleted.`);
    await expect(page.getByRole("row", { name: template.title })).toHaveCount(0);
  });

  test("keeps a template that has invitations", async ({ page, org, seed, tenant }) => {
    const title = unique.name("Busy role");
    await seed.record(tenant.slug, "invitation", { attributes: { template_title: title } });
    await page.goto(org("/templates"));
    await page.getByRole("button", { name: `Delete ${title}` }).click();

    await expect(page.getByRole("alert")).toHaveText(`"${title}" has invitations and cannot be deleted.`);
  });
});
