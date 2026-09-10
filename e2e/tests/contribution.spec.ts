import { test, expect } from "@playwright/test";
import { ADMIN_STORAGE_STATE, USER_STORAGE_STATE } from "../env";

test("contribution approval round-trip", async ({ browser }) => {
  const suffix =
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const universityName = `E2E University ${suffix}`;

  const userContext = await browser.newContext({
    storageState: USER_STORAGE_STATE,
  });
  const userPage = await userContext.newPage();

  await userPage.goto("/improve-data/add");
  await userPage
    .getByRole("combobox", { name: "Entity Type" })
    .selectOption("UNIVERSITY");
  await userPage
    .getByRole("combobox", { name: "Change", exact: true })
    .selectOption("CREATE");
  await userPage
    .getByRole("textbox", { name: "Name", exact: true })
    .fill(universityName);
  await userPage
    .getByRole("textbox", { name: "City", exact: true })
    .fill("Testograd");
  await userPage
    .getByRole("combobox", { name: "Entity", exact: true })
    .selectOption("FBIH");
  await userPage
    .getByRole("combobox", { name: "Ownership" })
    .selectOption("PUBLIC");
  await userPage.getByRole("button", { name: "Submit Suggestion" }).click();
  await expect(userPage.getByText("Suggestion submitted.")).toBeVisible();
  await userContext.close();

  const adminContext = await browser.newContext({
    storageState: ADMIN_STORAGE_STATE,
  });
  const adminPage = await adminContext.newPage();

  await adminPage.goto("/admin-dashboard/pending-changes");
  await adminPage.getByRole("button", { name: "Approve" }).click();
  await expect(
    adminPage.getByText("There are no pending changes at the moment."),
  ).toBeVisible();

  await adminPage.goto("/search");
  await adminPage.getByRole("searchbox", { name: "Search" }).fill(suffix);
  await adminPage.getByRole("button", { name: "Search", exact: true }).click();
  await expect(adminPage.getByText(universityName)).toBeVisible();
  await adminContext.close();
});
