import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { ADMIN_STORAGE_STATE, USER_STORAGE_STATE } from "../utils/env";
import { firstEntity } from "../utils/helpers";
import type { Page, Locator } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type Violations = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"];

function formatViolations(violations: Violations): string {
  return violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `    - ${n.target.join(" ")}`)
        .join("\n");
      return `${v.id} (impact: ${v.impact ?? "unknown"})\n  ${v.help}\n  ${v.helpUrl}\n  failing nodes:\n${nodes}`;
    })
    .join("\n\n");
}

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(formatViolations(results.violations)).toBe("");
}

const ROUTES: { path: string; ready: (page: Page) => Locator }[] = [
  {
    path: "/search",
    ready: (p) =>
      p.getByRole("heading", { name: "Find programs and universities" }),
  },
  {
    path: "/about",
    ready: (p) =>
      p.getByRole("heading", {
        name: "Universities and Study Programs in Bosnia and Herzegovina",
      }),
  },
  {
    path: "/api-docs",
    ready: (p) => p.getByRole("heading", { name: "REST API" }),
  },
  {
    path: "/login",
    ready: (p) => p.getByRole("heading", { name: "Log in" }),
  },
  {
    path: "/signup",
    ready: (p) => p.getByRole("heading", { name: "Create your account" }),
  },
];

for (const { path, ready } of ROUTES) {
  test(`${path} has no detectable a11y violations`, async ({ page }) => {
    await page.goto(path);
    await expect(ready(page)).toBeVisible();
    await expectNoViolations(page);
  });
}

test("search results have no detectable a11y violations", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox", { name: "Search" }).fill("univerzitet");
  await expect(
    page.locator('main a[href^="/universities/"]').first(),
  ).toBeVisible({ timeout: 5000 });
  await expectNoViolations(page);
});

test("detail pages have no detectable a11y violations", async ({
  page,
  request,
}) => {
  for (const path of ["universities", "faculties"] as const) {
    const entity = await firstEntity(request, path);

    await page.goto(`/${path}/${String(entity.id)}`);
    await expect(
      page.getByRole("heading", { name: entity.name, level: 1 }),
    ).toBeVisible();
    await expectNoViolations(page);
  }
});

test.describe("authenticated pages", () => {
  test.use({ storageState: USER_STORAGE_STATE });

  test("profile page has no detectable a11y violations", async ({ page }) => {
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "My Profile" }),
    ).toBeVisible();
    await expectNoViolations(page);
  });

  test("contribution dashboard has no detectable a11y violations", async ({
    page,
  }) => {
    await page.goto("/improve-data/add");
    await expect(
      page.getByRole("heading", { name: "Improve the Data" }),
    ).toBeVisible();
    await expectNoViolations(page);
  });

  test("tree paste tab has no detectable a11y violations", async ({ page }) => {
    await page.goto("/improve-data/add-tree");
    await expect(
      page.getByRole("textbox", { name: "JSON data" }),
    ).toBeVisible();
    await expectNoViolations(page);

    // the validated preview renders the nested tree cards - scan those too
    await page.getByRole("textbox", { name: "JSON data" }).fill(
      JSON.stringify({
        name: "A11y Tree University",
        city: "Testograd",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [
          {
            name: "A11y Faculty",
            studyPrograms: [
              {
                name: "A11y Program",
                cycle: "FIRST",
                tracks: [{ name: "A11y Track" }],
              },
            ],
          },
        ],
      }),
    );
    await page.getByRole("button", { name: "Validate" }).click();
    await expect(page.getByText("Preview")).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe("admin pages", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("pending changes tab has no detectable a11y violations", async ({
    page,
  }) => {
    await page.goto("/admin-dashboard/pending-changes");
    await expect(
      page.getByRole("heading", { name: "Admin Dashboard", exact: true }),
    ).toBeVisible();
    await expectNoViolations(page);
  });

  test("admin requests tab has no detectable a11y violations", async ({
    page,
  }) => {
    await page.goto("/admin-dashboard/admin-requests");
    await expect(
      page.getByRole("heading", { name: "Admin Dashboard", exact: true }),
    ).toBeVisible();
    await expectNoViolations(page);
  });
});
