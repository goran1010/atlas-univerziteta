import { test, expect } from "@playwright/test";
import { queryE2eDb } from "../utils/db";
import { ADMIN_STORAGE_STATE, USER_STORAGE_STATE } from "../utils/env";

import type { Page } from "@playwright/test";

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
    .getByRole("combobox", { name: "Item type" })
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
  await page.getByRole("combobox", { name: "Country" }).selectOption("BIH");
  await page
    .getByRole("combobox", { name: "Entity", exact: true })
    .selectOption("FBIH");
  await page
    .getByRole("combobox", { name: "Ownership" })
    .selectOption("PUBLIC");
  await page
    .getByRole("textbox", { name: "Comment for the admin" })
    .fill(`E2E comment for ${universityName}`);
  await page.getByRole("button", { name: "Submit Suggestion" }).click();
  await expect(page.getByText("Suggestion submitted.")).toBeVisible();
}

test("contribution approval round-trip", async ({ browser }) => {
  const { suffix, name: universityName } = uniqueName("E2E University");

  const userContext = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  const userPage = await userContext.newPage();
  await submitUniversityCreate(userPage, universityName);
  await userContext.close();

  const adminContext = await browser.newContext({
    storageState: ADMIN_STORAGE_STATE,
  });
  const adminPage = await adminContext.newPage();

  await adminPage.goto("/admin-dashboard/pending-changes");
  const changeRow = adminPage
    .getByRole("row")
    .filter({ hasText: universityName });
  await changeRow.getByRole("button", { name: "View info" }).click();
  await expect(
    adminPage
      .getByRole("dialog")
      .getByText(`E2E comment for ${universityName}`),
  ).toBeVisible();
  await adminPage
    .getByRole("dialog")
    .getByRole("button", { name: "Close" })
    .click();
  await adminPage.getByRole("button", { name: "Approve" }).click();
  await adminPage
    .getByRole("dialog")
    .getByRole("button", { name: "Approve" })
    .click();
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
  await adminContext.close();
});

test("whole tree JSON contribution approval round-trip", async ({
  browser,
}) => {
  const { suffix, name: universityName } = uniqueName("E2E Tree University");
  const facultyName = `E2E Tree Faculty ${suffix}`;
  const programName = `E2E Tree Program ${suffix}`;
  const trackName = `E2E Tree Track ${suffix}`;

  const tree = {
    name: universityName,
    city: "Testograd",
    country: "BIH",
    entity: "FBIH",
    ownership: "PUBLIC",
    faculties: [
      {
        name: facultyName,
        studyPrograms: [
          {
            name: programName,
            cycle: "FIRST",
            ects: 180,
            tracks: [{ name: trackName }],
          },
        ],
      },
    ],
  };

  const userContext = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  const userPage = await userContext.newPage();

  await userPage.goto("/improve-data/add-tree");
  await userPage
    .getByRole("textbox", { name: "JSON data" })
    .fill(JSON.stringify(tree, null, 2));
  await userPage.getByRole("button", { name: "Validate" }).click();
  await expect(userPage.getByText("Preview")).toBeVisible();
  await expect(userPage.getByText("Faculties (1)")).toBeVisible();
  await userPage.getByRole("button", { name: "Submit Suggestion" }).click();
  await expect(userPage.getByText("Suggestion submitted.")).toBeVisible();

  await userPage.goto("/improve-data/pending");
  await expect(userPage.getByText("+3 included")).toBeVisible();
  await userContext.close();

  const adminContext = await browser.newContext({
    storageState: ADMIN_STORAGE_STATE,
  });
  const adminPage = await adminContext.newPage();

  await adminPage.goto("/admin-dashboard/pending-changes");
  const changeRow = adminPage
    .getByRole("row")
    .filter({ hasText: universityName });
  await expect(changeRow.getByText("+3 included")).toBeVisible();
  await changeRow.getByRole("button", { name: "View info" }).click();
  const dialog = adminPage.getByRole("dialog");
  await expect(dialog.getByText("Faculties (1)")).toBeVisible();
  await expect(dialog.getByText(programName).first()).toBeVisible();
  await expect(dialog.getByText(trackName).first()).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  await adminPage.getByRole("button", { name: "Approve" }).click();
  await adminPage
    .getByRole("dialog")
    .getByRole("button", { name: "Approve" })
    .click();
  await expect(
    adminPage.getByText("There are no pending changes at the moment."),
  ).toBeVisible();

  // the whole subtree must be live, correctly linked level by level
  const rows = await queryE2eDb<{ track: string }>(
    `SELECT t.name AS track
       FROM track t
       JOIN study_program sp ON sp.id = t."studyProgramId"
       JOIN faculty f ON f.id = sp."facultyId"
       JOIN university u ON u.id = f."universityId"
      WHERE u.name = $1 AND f.name = $2 AND sp.name = $3`,
    [universityName, facultyName, programName],
  );
  expect(rows).toEqual([{ track: trackName }]);

  await adminPage.goto("/search");
  await adminPage.getByRole("searchbox", { name: "Search" }).fill(suffix);
  // the university, faculty, program and track cards all carry the
  // university name, so any single match proves the tree is searchable
  await expect(adminPage.getByText(universityName).first()).toBeVisible({
    timeout: 15000,
  });
  await adminContext.close();
});

test("tree JSON validation errors block submission", async ({ browser }) => {
  const userContext = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  const userPage = await userContext.newPage();

  await userPage.goto("/improve-data/add-tree");
  await userPage.getByRole("textbox", { name: "JSON data" }).fill(
    JSON.stringify({
      name: "E2E Broken Tree University",
      city: "Testograd",
      country: "BIH",
      entity: "FBIH",
      ownership: "PUBLIC",
      faculties: [{ name: "Same Faculty" }, { name: "Same Faculty" }],
    }),
  );
  await userPage.getByRole("button", { name: "Validate" }).click();

  await expect(userPage.getByText("Validation errors")).toBeVisible();
  await expect(
    userPage.getByText(/faculties\.1\.name: Duplicate faculty name/),
  ).toBeVisible();
  await expect(
    userPage.getByRole("button", { name: "Submit Suggestion" }),
  ).toBeDisabled();

  await userContext.close();
});

test("user can discard their own pending change", async ({ browser }) => {
  const { name: universityName } = uniqueName("E2E Discarded University");

  const userContext = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  const userPage = await userContext.newPage();

  await submitUniversityCreate(userPage, universityName);

  await userPage.goto("/improve-data/pending");
  const row = userPage.getByRole("row").filter({ hasText: "Create" });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Withdraw", exact: true }).click();
  await userPage
    .getByRole("dialog")
    .getByRole("button", { name: "Withdraw", exact: true })
    .click();

  await expect(userPage.getByText("Pending change discarded.")).toBeVisible();
  await expect(
    userPage.getByText("You have no suggestions awaiting review."),
  ).toBeVisible();

  await userContext.close();
});

test("user can submit an update suggestion for an existing university", async ({
  browser,
}) => {
  const { name: updatedName } = uniqueName("E2E Updated University");

  const userContext = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  const userPage = await userContext.newPage();

  await userPage.goto("/improve-data/add");
  await userPage
    .getByRole("combobox", { name: "Item type" })
    .selectOption("UNIVERSITY");
  await userPage
    .getByRole("combobox", { name: "Change", exact: true })
    .selectOption("UPDATE");

  // pick the first real university from the seeded list
  const universityPicker = userPage.getByRole("combobox", {
    name: "University",
    exact: true,
  });
  await expect(universityPicker.locator("option").nth(1)).toBeAttached();
  await universityPicker.selectOption({ index: 1 });

  await expect(userPage.getByText("Current data")).toBeVisible();

  await userPage
    .getByRole("textbox", { name: "Name", exact: true })
    .fill(updatedName);
  await userPage.getByRole("button", { name: "Submit Suggestion" }).click();
  await expect(userPage.getByText("Suggestion submitted.")).toBeVisible();

  await userPage.goto("/improve-data/pending");
  await expect(
    userPage.getByRole("row").filter({ hasText: "Update" }),
  ).toBeVisible();

  await userContext.close();
});

test("contribution rejection round-trip", async ({ browser }) => {
  const { suffix, name: universityName } = uniqueName(
    "E2E Rejected University",
  );

  const userContext = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  const userPage = await userContext.newPage();
  await submitUniversityCreate(userPage, universityName);
  await userContext.close();

  const adminContext = await browser.newContext({
    storageState: ADMIN_STORAGE_STATE,
  });
  const adminPage = await adminContext.newPage();

  await adminPage.goto("/admin-dashboard/pending-changes");
  await adminPage.getByRole("button", { name: "Reject" }).click();
  await adminPage
    .getByRole("dialog")
    .getByRole("button", { name: "Reject" })
    .click();
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
  await adminContext.close();
});
