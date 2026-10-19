import { test, expect } from "@playwright/test";
import { logIn } from "../utils/helpers";
import { E2E_USER } from "../utils/env";

const PASSWORD = "E2e_test_password_123";

function uniqueEmail(tag: string) {
  const suffix =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `e2e-${tag}-${suffix}@example.com`;
}

test("signup redirects to login", async ({ page }) => {
  const email = uniqueEmail("signup");

  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill(PASSWORD);
  await page.getByRole("textbox", { name: "Confirm Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(/\/login$/);
});

// the happy path also runs inside the setup project, but a regression there
// reports as "setup failed" plus cascading skips - this names it clearly
test("login with valid credentials shows the logged-in navbar", async ({
  page,
}) => {
  await logIn(page, E2E_USER);

  await expect(page.getByRole("link", { name: "Log In" })).toBeHidden();
});

test("login with wrong credentials shows an error", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(uniqueEmail("no-user"));
  await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
});

test("GitHub login button triggers OAuth redirect", async ({ page }) => {
  await page.route("https://github.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<title>github stub</title>",
    }),
  );

  await page.goto("/login");
  const authorizeRequest = page.waitForRequest((request) =>
    request.url().startsWith("https://github.com/login/oauth/authorize"),
  );
  await page.getByRole("button", { name: "Continue with GitHub" }).click();

  const url = new URL((await authorizeRequest).url());
  expect(url.searchParams.get("client_id")).toBeTruthy();
  expect(url.searchParams.get("response_type")).toBe("code");
});

test("Google login button triggers OAuth redirect", async ({ page }) => {
  await page.route("https://accounts.google.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<title>google stub</title>",
    }),
  );

  await page.goto("/login");
  const authorizeRequest = page.waitForRequest((request) =>
    request.url().startsWith("https://accounts.google.com/o/oauth2"),
  );
  await page.getByRole("button", { name: "Continue with Google" }).click();

  const url = new URL((await authorizeRequest).url());
  expect(url.searchParams.get("client_id")).toBeTruthy();
  expect(url.searchParams.get("response_type")).toBe("code");
});
