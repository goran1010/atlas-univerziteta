import { expect } from "@playwright/test";

import type { Page } from "@playwright/test";

export interface Account {
  email: string;
  password: string;
}

export async function logIn(page: Page, account: Account) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(account.email);
  await page.getByRole("textbox", { name: "Password" }).fill(account.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
}
