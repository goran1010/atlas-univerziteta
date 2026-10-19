import { test, expect } from "@playwright/test";
import { queryE2eDb } from "../db";
import { ADMIN_STORAGE_STATE, USER_STORAGE_STATE } from "../env";

import type { Browser, Page } from "@playwright/test";

// These tests share the single admin pending-changes queue, so they must not
// interleave: run them in order in one worker. Other spec files must not
// touch the queue.
test.describe.configure({ mode: "default" });

test.beforeEach(async () => {
  // a retry after a mid-test failure must not find the previous attempt's
  // pending change still queued when it asserts an empty queue
  await queryE2eDb('DELETE FROM "pending_change"', []);
});

function uniqueName(prefix: string) {
  const suffix =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return { suffix, name: `${prefix} ${suffix}` };
}

async function submitUniversityCreate(page: Page, universityName: string) {
  await page.goto("/improve-data/add");
  await page
    .getByRole("combobox", { name: "Entity Type" })
    .selectOption("UNIVERSITY");
  await page
    .getByRole("combobox", { name: "Change", exact: true })
    .selectOption("CREATE");
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill(universityName);
  await page
    .getByRole("textbox", { name: "City", exact: true })
    .fill("Testograd");
  await page
    .getByRole("combobox", { name: "Entity", exact: true })
    .selectOption("FBIH");
  await page
    .getByRole("combobox", { name: "Ownership" })
    .selectOption("PUBLIC");
  await page.getByRole("button", { name: "Submit Suggestion" }).click();
  await expect(page.getByText("Suggestion submitted.")).toBeVisible();
}

async function withUserPage(
  browser: Browser,
  run: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  await run(await context.newPage());
  await context.close();
}

async function withAdminPage(
  browser: Browser,
  run: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext({
    storageState: ADMIN_STORAGE_STATE,
  });
  await run(await context.newPage());
  await context.close();
}

test("contribution approval round-trip", async ({ browser }) => {
  const { suffix, name: universityName } = uniqueName("E2E University");

  await withUserPage(browser, async (userPage) => {
    await submitUniversityCreate(userPage, universityName);
  });

  await withAdminPage(browser, async (adminPage) => {
    await adminPage.goto("/admin-dashboard/pending-changes");
    await adminPage.getByRole("button", { name: "Approve" }).click();
    await expect(
      adminPage.getByText("There are no pending changes at the moment."),
    ).toBeVisible();

    await adminPage.goto("/search");
    await adminPage.getByRole("searchbox", { name: "Search" }).fill(suffix);
    // generous timeout: random suffixes expand to many variants,
    // making this search slow under parallel workers
    await expect(adminPage.getByText(universityName)).toBeVisible({
      timeout: 15000,
    });
  });
});

test("contribution rejection round-trip", async ({ browser }) => {
  const { suffix, name: universityName } = uniqueName(
    "E2E Rejected University",
  );

  await withUserPage(browser, async (userPage) => {
    await submitUniversityCreate(userPage, universityName);
  });

  await withAdminPage(browser, async (adminPage) => {
    await adminPage.goto("/admin-dashboard/pending-changes");
    await adminPage.getByRole("button", { name: "Reject" }).click();
    await expect(
      adminPage.getByText("There are no pending changes at the moment."),
    ).toBeVisible();

    // the rejected university must never appear in the data
    await adminPage.goto("/search");
    await adminPage.getByRole("searchbox", { name: "Search" }).fill(suffix);
    await expect(adminPage.getByText("No results found.")).toBeVisible({
      timeout: 15000,
    });
    await expect(adminPage.getByText(universityName)).toBeHidden();
  });
});
