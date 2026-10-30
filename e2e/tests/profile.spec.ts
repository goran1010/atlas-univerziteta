import { test, expect } from "@playwright/test";
import { queryE2eDb } from "../utils/db";
import { logIn } from "../utils/helpers";
import { E2E_USER, USER_STORAGE_STATE } from "../utils/env";

test.describe("profile admin request", () => {
  test.use({ storageState: USER_STORAGE_STATE });

  test.beforeEach(async () => {
    // retries must start from "no active request" regardless of where the
    // previous attempt stopped
    await queryE2eDb(
      'UPDATE "user" SET "adminRequestedAt" = NULL WHERE email = $1',
      [E2E_USER.email],
    );
  });

  test("shows the user's email and role", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { name: "My Profile" }),
    ).toBeVisible();
    await expect(page.getByText(E2E_USER.email)).toBeVisible();
    await expect(page.getByText("USER", { exact: true })).toBeVisible();
  });

  test("requests admin access and cancels the request", async ({ page }) => {
    await page.goto("/profile");

    await page.getByRole("button", { name: "Request admin access" }).click();
    await expect(page.getByText("Admin request pending")).toBeVisible();

    // the request survives a reload, so it reached the server
    await page.reload();
    await expect(page.getByText("Admin request pending")).toBeVisible();

    await page.getByRole("button", { name: "Cancel admin request" }).click();
    await expect(
      page.getByRole("button", { name: "Request admin access" }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("button", { name: "Request admin access" }),
    ).toBeVisible();
    await expect(page.getByText("Admin request pending")).toBeHidden();
  });
});

test.describe("logout", () => {
  // deliberately NOT the shared USER_STORAGE_STATE: signing out revokes the
  // session server-side, which would break every later spec reusing it -
  // so this test logs in fresh and revokes only its own session
  test("logs out and stays logged out after a reload", async ({ page }) => {
    await logIn(page, E2E_USER);

    await page.goto("/profile");
    await page.getByRole("button", { name: "Log out" }).click();

    await expect(page.getByText("Successfully logged out")).toBeVisible();
    await expect(page.getByRole("link", { name: "Log In" })).toBeVisible();

    // still logged out after a reload
    await page.reload();
    await expect(page.getByRole("link", { name: "Log In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Profile" })).toBeHidden();
  });
});

test.describe("access control", () => {
  test("anonymous visitors are asked to log in", async ({ page }) => {
    await page.goto("/profile");
    await expect(
      page.getByText("You need to be logged in to view your profile."),
    ).toBeVisible();

    await page.goto("/improve-data");
    await expect(
      page.getByText(
        "You need to be a registered user to propose changes to the content.",
      ),
    ).toBeVisible();

    await page.goto("/admin-dashboard");
    await expect(
      page.getByText(
        "You need to be logged in and an admin to see the admin dashboard.",
      ),
    ).toBeVisible();
  });

  test.describe("as a regular user", () => {
    test.use({ storageState: USER_STORAGE_STATE });

    test("the admin dashboard requires the admin role", async ({ page }) => {
      await page.goto("/admin-dashboard");

      await expect(
        page.getByText("You need to be an admin to see the admin dashboard."),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Admin Dashboard", exact: true }),
      ).toBeHidden();
    });
  });
});

test("an unknown route shows the 404 page", async ({ page }) => {
  await page.goto("/no-such-page");

  await expect(page.getByText("There is nothing here.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Go to Home Page" }),
  ).toBeVisible();
});
