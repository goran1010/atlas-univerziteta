import { expect } from "@playwright/test";

import { E2E_SERVER_URL } from "./env";

import type { APIRequestContext, Page } from "@playwright/test";

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

export async function firstEntity(
  request: APIRequestContext,
  path: "universities" | "faculties",
) {
  const response = await request.get(`${E2E_SERVER_URL}/api/v1/${path}`);
  expect(response.ok()).toBe(true);
  const { data } = (await response.json()) as {
    data: { id: number; name: string }[];
  };
  const entity = data.at(0);
  if (!entity) throw new Error(`Expected at least one seeded ${path} row`);
  return entity;
}
