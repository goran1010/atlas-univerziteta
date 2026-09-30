import { test as setup, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { queryE2eDb } from "../db";
import {
  ADMIN_STORAGE_STATE,
  E2E_ADMIN,
  E2E_USER,
  USER_STORAGE_STATE,
} from "../env";

interface Account {
  email: string;
  password: string;
}

async function signUpAndVerify(page: Page, account: Account) {
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

  await queryE2eDb(
    'UPDATE "user" SET "emailVerified" = true WHERE email = $1',
    [account.email],
  );
}

async function logIn(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(account.email);
  await page.getByRole("textbox", { name: "Password" }).fill(account.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
}

setup("provision regular user", async ({ page }) => {
  await signUpAndVerify(page, E2E_USER);
  await logIn(page, E2E_USER);
  await page.context().storageState({ path: USER_STORAGE_STATE });
});

setup("provision admin", async ({ page }) => {
  await signUpAndVerify(page, E2E_ADMIN);
  await queryE2eDb("UPDATE \"user\" SET role = 'ADMIN' WHERE email = $1", [
    E2E_ADMIN.email,
  ]);
  await logIn(page, E2E_ADMIN);
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
