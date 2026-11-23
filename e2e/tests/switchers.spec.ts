import { test, expect } from "@playwright/test";

test("language select switches to BHS and persists across reloads", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find programs and universities" }),
  ).toBeVisible();

  await page.getByRole("combobox", { name: "Language" }).selectOption("sr");

  await expect(
    page.getByRole("heading", { name: "Nađite programe i univerzitete" }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Nađite programe i univerzitete" }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Jezik" })).toHaveValue("sr");
  await expect(page.locator("html")).toHaveAttribute("lang", "sr-Latn");
});

test("theme select applies dark mode and persists across reloads", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find programs and universities" }),
  ).toBeVisible();

  const themeSelect = page.getByRole("combobox", { name: "Theme" });
  await themeSelect.selectOption("light");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await themeSelect.selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(themeSelect).toHaveValue("dark");
});
