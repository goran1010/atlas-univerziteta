import { test as setup, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { queryE2eDb } from "../utils/db";
import {
  ADMIN_STORAGE_STATE,
  E2E_ADMIN,
  E2E_USER,
  USER_STORAGE_STATE,
} from "../utils/env";

import { logIn } from "../utils/helpers";
import type { Account } from "../utils/helpers";

// CI retries re-run this setup, and a leftover account from the failed
// attempt would make the fixed-email signup fail - start from a clean slate
async function deleteAccount(email: string) {
  const rows = await queryE2eDb<{ id: string }>(
    'SELECT id FROM "user" WHERE email = $1',
    [email],
  );
  const id = rows[0]?.id;
  if (!id) return;
  await queryE2eDb('DELETE FROM "account" WHERE "userId" = $1', [id]);
  await queryE2eDb('DELETE FROM "session" WHERE "userId" = $1', [id]);
  await queryE2eDb('DELETE FROM "pending_change" WHERE "userId" = $1', [id]);
  await queryE2eDb('DELETE FROM "user" WHERE id = $1', [id]);
}

async function signUpAndVerify(page: Page, account: Account) {
  await deleteAccount(account.email);
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
