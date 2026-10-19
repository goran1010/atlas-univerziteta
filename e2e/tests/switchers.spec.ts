import { test, expect } from "@playwright/test";

// both switchers cycle from "system" (fresh browser), so two clicks land on
// the second explicit option: system -> en -> sr, system -> light -> dark

test("language switcher cycles to Serbian and persists across reloads", async ({
  page,
}) => {
  await page.goto("/search");
  await expect(
    page.getByRole("heading", { name: "Find programs and universities" }),
  ).toBeVisible();

  const toggle = page.getByRole("button", { name: /Toggle language/i });
  await toggle.click();
  await toggle.click();

  await expect(
    page.getByRole("heading", { name: "Nađite programe i univerzitete" }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Nađite programe i univerzitete" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "sr");
});

test("theme switcher applies dark mode and persists across reloads", async ({
  page,
}) => {
  await page.goto("/search");
  await expect(
    page.getByRole("heading", { name: "Find programs and universities" }),
  ).toBeVisible();

  const toggle = page.getByRole("button", { name: /Toggle theme/i });
  await toggle.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
