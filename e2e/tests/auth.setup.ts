import { test as setup, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { queryE2eDb } from "../db";
import {
  ADMIN_STORAGE_STATE,
  E2E_ADMIN,
  E2E_SERVER_URL,
  E2E_USER,
  USER_STORAGE_STATE,
} from "../env";

interface Account {
  email: string;
  password: string;
}

async function signUpAndConfirm(page: Page, account: Account) {
  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Email" }).fill(account.email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(account.password);
  await page
    .getByRole("textbox", { name: "Confirm Password" })
    .fill(account.password);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/login$/);

  const pending = await queryE2eDb<{ token: string }>(
    "SELECT token FROM pending_users WHERE email = $1",
    [account.email],
  );
  await page.goto(`${E2E_SERVER_URL}/auth/confirm/${pending[0].token}`);
  await expect(
    page.getByRole("heading", { name: "Your email has been confirmed!" }),
  ).toBeVisible();
}

async function logIn(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(account.email);
  await page.getByRole("textbox", { name: "Password" }).fill(account.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
}

setup("provision regular user", async ({ page }) => {
  await signUpAndConfirm(page, E2E_USER);
  await logIn(page, E2E_USER);
  await page.context().storageState({ path: USER_STORAGE_STATE });
});

setup("provision admin", async ({ page }) => {
  await signUpAndConfirm(page, E2E_ADMIN);
  await queryE2eDb("UPDATE users SET role = 'ADMIN' WHERE email = $1", [
    E2E_ADMIN.email,
  ]);
  await logIn(page, E2E_ADMIN);
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
