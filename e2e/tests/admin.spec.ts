import { test, expect } from "@playwright/test";
import { queryE2eDb } from "../utils/db";
import { ADMIN_STORAGE_STATE } from "../utils/env";

// Throwaway requesters are created directly in the database so this spec
// never touches the shared e2e user's role, and each test finds its own row
// by its unique email - safe next to other specs.
const REQUESTER_EMAIL_PREFIX = "e2e-admin-request-";

function createRequester() {
  const id = crypto.randomUUID();
  const email = `${REQUESTER_EMAIL_PREFIX}${id.slice(0, 8)}@example.com`;
  return { id, email };
}

async function insertAdminRequest(requester: { id: string; email: string }) {
  await queryE2eDb(
    `INSERT INTO "user"
       (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "adminRequestedAt")
     VALUES ($1, $2, $3, true, now(), now(), 'USER', now())`,
    [requester.id, requester.email, requester.email],
  );
}

async function fetchRequester(id: string) {
  const rows = await queryE2eDb<{
    role: string;
    adminRequestedAt: Date | null;
  }>('SELECT role, "adminRequestedAt" FROM "user" WHERE id = $1', [id]);
  const row = rows.at(0);
  if (!row) throw new Error("Requester row disappeared");
  return row;
}

test.use({ storageState: ADMIN_STORAGE_STATE });

// No cleanup hooks on purpose: these tests run in parallel workers, so a
// prefix-wide delete from one test would race the other's in-flight row.
// Rows are unique per test, and global-setup resets the database every run.

test("approving an admin request promotes the user and clears the row", async ({
  page,
}) => {
  const requester = createRequester();
  await insertAdminRequest(requester);

  await page.goto("/admin-dashboard/admin-requests");
  const row = page.getByRole("listitem").filter({ hasText: requester.email });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Approve" }).click();

  await expect(page.getByText("Admin request approved.")).toBeVisible();
  await expect(row).toBeHidden();

  const updated = await fetchRequester(requester.id);
  expect(updated.role).toBe("ADMIN");
  expect(updated.adminRequestedAt).toBeNull();
});

test("declining an admin request keeps the user role and clears the row", async ({
  page,
}) => {
  const requester = createRequester();
  await insertAdminRequest(requester);

  await page.goto("/admin-dashboard/admin-requests");
  const row = page.getByRole("listitem").filter({ hasText: requester.email });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Reject" }).click();

  await expect(page.getByText("Admin request declined.")).toBeVisible();
  await expect(row).toBeHidden();

  const updated = await fetchRequester(requester.id);
  expect(updated.role).toBe("USER");
  expect(updated.adminRequestedAt).toBeNull();
});
