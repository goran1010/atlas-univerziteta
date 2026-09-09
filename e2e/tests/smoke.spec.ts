import { test, expect } from "@playwright/test";

test("home redirects to the search page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
