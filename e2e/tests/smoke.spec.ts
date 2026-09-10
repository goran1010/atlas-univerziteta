import { test, expect } from "@playwright/test";

test.describe("search page", () => {
  test("home redirects to the search page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/search$/);
    await expect(
      page.getByRole("heading", { name: "Find programs and universities" }),
    ).toBeVisible();
  });

  test("searching returns results", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("searchbox", { name: "Search" }).fill("univerzitet");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Universities", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("listitem").first(),
    ).toBeVisible();
  });
});

test.describe("browse page", () => {
  test("lists universities from the database", async ({ page }) => {
    await page.goto("/browse");
    await expect(
      page.getByRole("main").getByRole("listitem").first(),
    ).toBeVisible();
  });
});

test.describe("static pages", () => {
  test("about page renders", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.getByRole("heading", {
        name: "Universities and Study Programs in Bosnia and Herzegovina",
      }),
    ).toBeVisible();
  });

  test("api docs page renders", async ({ page }) => {
    await page.goto("/api-docs");
    await expect(page.getByRole("heading", { name: "REST API" })).toBeVisible();
  });
});

test.describe("auth pages", () => {
  test("login page renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("signup page renders the form", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Password", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/search");
    await page.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await page.getByRole("link", { name: "Log In" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
