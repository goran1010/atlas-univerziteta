import { test, expect } from "@playwright/test";

test.describe("detail pages", () => {
  test("clicking a university navigates to its detail page", async ({
    page,
  }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: /Browse All/i }).click();
    await expect(
      page.getByRole("main").getByRole("listitem").first(),
    ).toBeVisible();

    const firstUniLink = page
      .getByRole("main")
      .getByRole("listitem")
      .first()
      .getByRole("link")
      .first();
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
    await expect(
      page.getByRole("main").getByRole("listitem").first(),
    ).toBeVisible();

    await page
      .getByRole("main")
      .getByRole("listitem")
      .first()
      .getByRole("link")
      .first()
      .click();

    await expect(page).toHaveURL(/\/universities\/\d+$/);
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("listitem").first(),
    ).toBeVisible();
  });

  test("direct visit to /universities/:id renders detail page", async ({
    page,
  }) => {
    await page.goto("/universities/1");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeVisible();
  });

  test("direct visit to /faculties/:id renders detail page with breadcrumbs", async ({
    page,
  }) => {
    await page.goto("/faculties/1");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

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
    const firstProgramLink = page
      .getByRole("main")
      .getByRole("listitem")
      .first()
      .getByRole("link")
      .first();
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
      page.getByRole("main").getByRole("listitem").first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
