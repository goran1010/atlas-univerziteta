import { test, expect } from "@playwright/test";
import { E2E_SERVER_URL } from "../env";

import type { APIRequestContext } from "@playwright/test";

async function firstEntity(
  request: APIRequestContext,
  path: "universities" | "faculties",
) {
  const response = await request.get(`${E2E_SERVER_URL}/api/v1/${path}`);
  expect(response.ok()).toBe(true);
  const { data } = (await response.json()) as {
    data: { id: number; name: string }[];
  };
  const entity = data.at(0);
  if (!entity) throw new Error(`Expected at least one seeded ${path} row`);
  return entity;
}

test.describe("detail pages", () => {
  test("clicking a university navigates to its detail page", async ({
    page,
  }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: /Browse All/i }).click();

    const firstUniLink = page.locator('main a[href^="/universities/"]').first();
    await expect(firstUniLink).toBeVisible();
    const uniName = await firstUniLink.textContent();
    await firstUniLink.click();

    await expect(page).toHaveURL(/\/universities\/\d+$/);
    await expect(
      page.getByRole("heading", { name: uniName ?? "", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  test("university detail page shows faculties", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: /Browse All/i }).click();

    const firstUniLink = page.locator('main a[href^="/universities/"]').first();
    await expect(firstUniLink).toBeVisible();
    await firstUniLink.click();

    await expect(page).toHaveURL(/\/universities\/\d+$/);
    await expect(
      page.getByRole("heading", { level: 2, name: /faculty|faculties/i }),
    ).toBeVisible();
    await expect(
      page.locator('main a[href^="/faculties/"]').first(),
    ).toBeVisible();
  });

  test("direct visit to /universities/:id renders detail page", async ({
    page,
    request,
  }) => {
    const university = await firstEntity(request, "universities");

    await page.goto(`/universities/${String(university.id)}`);

    await expect(
      page.getByRole("heading", { name: university.name, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  test("direct visit to /faculties/:id renders detail page with breadcrumbs", async ({
    page,
    request,
  }) => {
    const faculty = await firstEntity(request, "faculties");

    await page.goto(`/faculties/${String(faculty.id)}`);

    await expect(
      page.getByRole("heading", { name: faculty.name, level: 1 }),
    ).toBeVisible();

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByRole("link").first()).toBeVisible();
  });

  test("program search result opens the faculty page focused on that program", async ({
    page,
  }) => {
    await page.goto("/search?type=studyProgram");
    // large sections render their groups collapsed by default
    const expandFirstGroup = page
      .getByRole("button", { name: "Expand" })
      .first();
    await expect(expandFirstGroup).toBeVisible({ timeout: 15000 });
    await expandFirstGroup.click();

    const firstProgramLink = page.locator('main a[href*="?program="]').first();
    await expect(firstProgramLink).toBeVisible({ timeout: 15000 });
    await firstProgramLink.click();

    await expect(page).toHaveURL(/\/faculties\/\d+\?program=\d+$/);
    const showAll = page.getByRole("button", {
      name: /Show all study programs/,
    });
    await expect(showAll).toBeVisible();

    await showAll.click();
    await expect(showAll).toBeHidden();
    await expect(page).toHaveURL(/\/faculties\/\d+$/);
  });

  test("URL deep-link with filters loads filtered results", async ({
    page,
  }) => {
    await page.goto("/search?ownership=PUBLIC");
    // filter-only search returns a large payload; slow under parallel workers
    await expect(
      page.locator('main a[href^="/universities/"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
