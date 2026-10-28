import { test, expect } from "@playwright/test";
import { queryE2eDb } from "../utils/db";
import { logIn } from "../utils/helpers";
import { E2E_SERVER_URL, E2E_WEBAPP_URL } from "../utils/env";

const PASSWORD = "E2e_test_password_123";
const NEW_PASSWORD = "E2e_new_password_456";

function uniqueEmail(tag: string) {
  const suffix =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `e2e-${tag}-${suffix}@example.com`;
}

test("full password reset flow from forgot link to login", async ({
  page,
  request,
}) => {
  const email = uniqueEmail("reset");

  // provision a verified account over the API - the signup UX has its own test
  const signUp = await request.post(
    `${E2E_SERVER_URL}/api/auth/sign-up/email`,
    { data: { email, password: PASSWORD, name: "reset e2e" } },
  );
  expect(signUp.ok()).toBe(true);
  await queryE2eDb(
    'UPDATE "user" SET "emailVerified" = true WHERE email = $1',
    [email],
  );

  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/reset link is on its way/i)).toBeVisible();

  // the dev-mode email is only logged, so pull the token from the database
  // and open the same server link the email would carry
  const rows = await queryE2eDb<{ identifier: string }>(
    `SELECT v.identifier FROM "verification" v
       JOIN "user" u ON v.value = u.id
      WHERE u.email = $1 AND v.identifier LIKE 'reset-password:%'`,
    [email],
  );
  const token = rows[0]?.identifier.replace("reset-password:", "");
  expect(token).toBeTruthy();
  const resetLink = `${E2E_SERVER_URL}/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent(`${E2E_WEBAPP_URL}/reset-password`)}`;

  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/reset-password\?token=/);

  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(NEW_PASSWORD);
  await page
    .getByRole("textbox", { name: "Confirm Password" })
    .fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await logIn(page, { email, password: NEW_PASSWORD });

  // the token is single-use - revisiting the link lands on the invalid state
  await page.goto(resetLink);
  await expect(page.getByRole("heading", { name: /not valid/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Request a new link" }),
  ).toBeVisible();
});

test("a reset link with a bad token shows the invalid state", async ({
  page,
}) => {
  await page.goto("/reset-password?error=INVALID_TOKEN");

  await expect(page.getByRole("heading", { name: /not valid/i })).toBeVisible();
  await page.getByRole("link", { name: "Request a new link" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});
