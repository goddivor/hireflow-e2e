import { userTest as test, expect } from "../../fixtures";

test.describe("tasks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
  });

  test("adds a task", async ({ page }) => {
    await page.getByLabel("New task").fill("Write the release notes");
    await page.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByTestId("task").filter({ hasText: "Write the release notes" })).toBeVisible();
  });

  test("counts open tasks", async ({ page }) => {
    for (const title of ["Book the venue", "Order badges", "Print the schedule"]) {
      await page.getByLabel("New task").fill(title);
      await page.getByRole("button", { name: "Add task" }).click();
    }
    await expect(page.getByTestId("open-count")).toHaveText("3 open tasks");
  });

  test("completes and reopens a task", async ({ page }) => {
    await page.getByLabel("New task").fill("Renew the domain");
    await page.getByRole("button", { name: "Add task" }).click();

    await page.getByRole("button", { name: "Complete Renew the domain" }).click();
    await expect(page.getByTestId("task").filter({ hasText: "Renew the domain" })).toHaveClass(/done/);

    await page.getByRole("button", { name: "Reopen Renew the domain" }).click();
    await expect(page.getByTestId("task").filter({ hasText: "Renew the domain" })).not.toHaveClass(/done/);
  });

  test("deletes a task", async ({ page }) => {
    await page.getByLabel("New task").fill("Cancel the old plan");
    await page.getByRole("button", { name: "Add task" }).click();
    await page.getByRole("button", { name: "Delete Cancel the old plan" }).click();
    await expect(page.getByTestId("task").filter({ hasText: "Cancel the old plan" })).toHaveCount(0);
  });

  test("shows the empty state", async ({ page }) => {
    await expect(page.getByTestId("empty")).toHaveText("Nothing to do yet.");
  });

  test("renders task titles as text, not HTML", async ({ page }) => {
    const title = `<img src=x onerror="document.body.dataset.pwned=1">`;
    await page.getByLabel("New task").fill(title);
    await page.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByTestId("task").filter({ hasText: title })).toBeVisible();
    await expect(page.locator("body")).not.toHaveAttribute("data-pwned");
  });

  test("keeps tasks after a reload", async ({ page }) => {
    await page.getByLabel("New task").fill("Call the accountant");
    await page.getByRole("button", { name: "Add task" }).click();
    await page.reload();
    await expect(page.getByTestId("task").filter({ hasText: "Call the accountant" })).toBeVisible();
  });
});
