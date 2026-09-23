import { test, expect } from "../../fixtures";
import { unique } from "../../support/data";
import type { SeedApi } from "../../support/seed";

test.use({ role: "recruiter" });

test.describe("invitations table", () => {
  // The worker's tenant is shared by the tests it runs, so every assertion is scoped to this test's
  // own candidates through the search box, never to the whole table.
  const seedInvitations = async (seed: SeedApi, slug: string) => {
    const tag = unique.name("Table");
    const rows = [
      { name: `${tag} Avery`, status: [] as string[], template: "Alpha role" },
      { name: `${tag} Blake`, status: ["opened"], template: "Charlie role" },
      { name: `${tag} Cameron`, status: ["completed"], template: "Bravo role" },
    ];
    for (const row of rows) {
      await seed.record(slug, "invitation", {
        traits: row.status,
        attributes: { candidate_name: row.name, template_title: unique.name(row.template) },
      });
    }
    return { tag, rows };
  };

  test("searches candidates by name", async ({ page, org, seed, tenant }) => {
    const { tag } = await seedInvitations(seed, tenant.slug);
    await page.goto(org("/invitations"));
    await page.getByRole("searchbox", { name: "Search candidates" }).fill(`${tag} Blake`);
    await page.getByRole("button", { name: "Filter" }).click();

    const table = page.getByRole("table", { name: "Invitations" });
    await expect(table.getByRole("row")).toHaveCount(2);
    await expect(table.getByRole("row", { name: `${tag} Blake` })).toContainText("Opened");
  });

  test("filters by status", async ({ page, org, seed, tenant }) => {
    const { tag } = await seedInvitations(seed, tenant.slug);
    await page.goto(org("/invitations"));
    await page.getByRole("searchbox", { name: "Search candidates" }).fill(tag);
    await page.getByLabel("Status").selectOption("Completed");
    await page.getByRole("button", { name: "Filter" }).click();

    const rows = page.getByRole("table", { name: "Invitations" }).getByRole("row");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText(`${tag} Cameron`);
  });

  test("sorts by candidate, both ways", async ({ page, org, seed, tenant }) => {
    const { tag } = await seedInvitations(seed, tenant.slug);
    await page.goto(org(`/invitations?q=${encodeURIComponent(tag)}`));
    const table = page.getByRole("table", { name: "Invitations" });
    const candidateHeader = table.getByRole("columnheader", { name: "Candidate" });
    // Rows of the body only: the header row is the table's first rowgroup.
    const bodyRows = table.getByRole("rowgroup").last().getByRole("row");
    const startsWith = (names: string[]) => names.map((name) => new RegExp(`^\\s*${name}\\b`));

    await candidateHeader.getByRole("link").click();
    await expect(candidateHeader).toHaveAttribute("aria-sort", "ascending");
    await expect(bodyRows).toHaveText(startsWith([`${tag} Avery`, `${tag} Blake`, `${tag} Cameron`]));

    await candidateHeader.getByRole("link").click();
    await expect(candidateHeader).toHaveAttribute("aria-sort", "descending");
    await expect(bodyRows).toHaveText(startsWith([`${tag} Cameron`, `${tag} Blake`, `${tag} Avery`]));
  });

  test("shows only this tenant's invitations", async ({ page, org, seed }) => {
    const other = await seed.tenant(unique.name("Other tenant"));
    const outsider = unique.name("Outsider");
    await seed.record(other.slug, "invitation", { attributes: { candidate_name: outsider } });

    await page.goto(org(`/invitations?q=${encodeURIComponent(outsider)}`));
    await expect(page.getByText("No invitations match.")).toBeVisible();
  });
});
