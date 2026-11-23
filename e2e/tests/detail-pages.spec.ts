import { test, expect } from "@playwright/test";
import { E2E_SERVER_URL } from "../utils/env";
import { firstEntity } from "../utils/helpers";

import type { APIRequestContext } from "@playwright/test";

async function firstUniversityWithFaculties(request: APIRequestContext) {
  const response = await request.get(`${E2E_SERVER_URL}/api/v1/universities`);
  expect(response.ok()).toBe(true);
  const { data } = (await response.json()) as {
    data: { id: number; name: string; _count?: { faculties: number } }[];
  };
  const university = data.find((u) => (u._count?.faculties ?? 0) > 0);
  if (!university) {
    throw new Error("Expected a seeded university that has faculties");
  }
  return university;
}

test.describe("detail pages", () => {
  test("a university's View info dialog opens its detail page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Browse All/i }).click();

    const viewInfo = page.getByRole("button", { name: "View info" }).first();
    await expect(viewInfo).toBeVisible();
    await viewInfo.click();
    const dialog = page.getByRole("dialog");
    // the dialog title appends the acronym; the page heading styles it apart
    const uniName = (
      await dialog.getByRole("heading").first().textContent()
    )?.replace(/ \([^)]*\)$/, "");
    await dialog.getByRole("link", { name: "Open full page" }).click();

    await expect(page).toHaveURL(/\/universities\/\d+$/);
    await expect(
      page.getByRole("heading", { name: uniName ?? "", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  test("university detail page shows faculties", async ({ page, request }) => {
    const university = await firstUniversityWithFaculties(request);

    await page.goto(`/universities/${String(university.id)}`);

    await expect(
      page.getByRole("heading", { name: university.name, level: 1 }),
    ).toBeVisible();
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
    await page.goto("/");
    // "grafika" is a study program name, giving a direct match in that section
    await page.getByRole("searchbox", { name: "Search" }).fill("grafika");

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

  test("the Home breadcrumb leads back to the search a detail page was opened from", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Search" }).fill("grafika");

    const firstProgramLink = page.locator('main a[href*="?program="]').first();
    await expect(firstProgramLink).toBeVisible({ timeout: 15000 });
    await firstProgramLink.click();
    await expect(page).toHaveURL(/\/faculties\/\d+/);

    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: "Home" })
      .click();

    await expect(page).toHaveURL(/\/\?q=grafika$/);
    await expect(page.getByRole("searchbox", { name: "Search" })).toHaveValue(
      "grafika",
    );
    await expect(page.locator('main a[href*="?program="]').first()).toBeVisible(
      { timeout: 15000 },
    );
  });

  test("URL deep-link with country filter loads filtered results", async ({
    page,
  }) => {
    await page.goto("/?country=BIH");
    await expect(
      page.getByRole("button", { name: "View info" }).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
