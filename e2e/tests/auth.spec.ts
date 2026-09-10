import { test, expect } from "@playwright/test";
import { queryE2eDb } from "../db";
import { E2E_SERVER_URL } from "../env";

const PASSWORD = "E2e_test_password_123";

function uniqueEmail(tag: string) {
  const suffix =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `e2e-${tag}-${suffix}@example.com`;
}

test("signup, email confirmation, and login round-trip", async ({ page }) => {
  const email = uniqueEmail("signup");

  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(PASSWORD);
  await page.getByRole("textbox", { name: "Confirm Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(/\/login$/);

  const pending = await queryE2eDb<{ token: string }>(
    "SELECT token FROM pending_users WHERE email = $1",
    [email],
  );
  expect(pending).toHaveLength(1);

  await page.goto(`${E2E_SERVER_URL}/auth/confirm/${pending[0].token}`);
  await expect(
    page.getByRole("heading", { name: "Your email has been confirmed!" }),
  ).toBeVisible();

  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
});

test("login with wrong credentials shows an error", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(uniqueEmail("nouser"));
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
});
