import {
  handleApprovePendingChange,
  handleDeclinePendingChange,
  handleApproveAdminRequest,
  handleDeclineAdminRequest,
} from "../../../../../src/components/AdminDashboard/utils/adminActions";
import { getCsrfToken } from "../../../../../src/utils/getCsrfToken";
import { guardedFetch } from "../../../../../src/utils/guardedFetch";

import type { RequestContext } from "../../../../../src/utils/apiMutation";
import type { AdminPendingChange } from "../../../../../src/schemas/pendingChange";
import type { AdminRequest } from "../../../../../src/schemas/adminRequest";

vi.mock("../../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../../src/utils/getCsrfToken")
    >();
  return { ...actual, getCsrfToken: vi.fn() };
});

vi.mock("../../../../../src/utils/guardedFetch", () => ({
  guardedFetch: vi.fn(),
}));

const mockedGetCsrfToken = vi.mocked(getCsrfToken);
const mockedGuardedFetch = vi.mocked(guardedFetch);

const change: AdminPendingChange = {
  id: "8687b282-fcc6-4f69-8744-0f8e1585d991",
  entityType: "FACULTY",
  typeOfChange: "UPDATE",
  targetId: 1,
  parentId: null,
  data: { name: "Updated faculty" },
  userId: "user-1",
  user: { email: "johndoe@examplemail.com", role: "USER" },
  createdAt: new Date(),
  currentEntity: null,
};

const adminRequest: AdminRequest = {
  id: "user-1",
  email: "johndoe@examplemail.com",
  adminRequestedAt: "2026-07-25T10:00:00.000Z",
};

function createCtx(): RequestContext {
  return {
    addNotification: vi.fn(),
    setLoading: vi.fn(),
    t: (key: string) => key,
    serverStatus: "live",
  };
}

beforeEach(() => {
  mockedGetCsrfToken.mockReset();
  mockedGuardedFetch.mockReset();
  mockedGetCsrfToken.mockResolvedValue("csrf-token");
  mockedGuardedFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ message: "Done." }),
  } as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleApprovePendingChange", () => {
  test("posts the change id, removes the change and notifies", async () => {
    const ctx = createCtx();
    const setPendingChanges = vi.fn();

    await handleApprovePendingChange(change, setPendingChanges, ctx);

    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/admin/approve-pending-change"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: change.id }),
      }),
      expect.objectContaining({ serverStatus: "live" }),
    );
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.admin.approveSuccess",
    });
    const updater = setPendingChanges.mock.calls[0]?.[0] as (
      prev: AdminPendingChange[],
    ) => AdminPendingChange[];
    expect(updater([change, { ...change, id: "other" }])).toEqual([
      { ...change, id: "other" },
    ]);
  });

  test("shows a translated error and keeps the list when approval fails", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Approval failed." } }),
    } as Response);
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const ctx = createCtx();
    const setPendingChanges = vi.fn();

    await handleApprovePendingChange(change, setPendingChanges, ctx);

    expect(setPendingChanges).not.toHaveBeenCalled();
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.admin.approveError",
    });
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});

describe("handleDeclinePendingChange", () => {
  test("deletes the change, removes it from the list and notifies", async () => {
    const ctx = createCtx();
    const setPendingChanges = vi.fn();

    await handleDeclinePendingChange(change, setPendingChanges, ctx);

    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/admin/decline-pending-change"),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ id: change.id }),
      }),
      expect.objectContaining({ serverStatus: "live" }),
    );
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.admin.declineSuccess",
    });
    const updater = setPendingChanges.mock.calls[0]?.[0] as (
      prev: AdminPendingChange[],
    ) => AdminPendingChange[];
    expect(updater([change, { ...change, id: "other" }])).toEqual([
      { ...change, id: "other" },
    ]);
  });
});

describe("handleApproveAdminRequest", () => {
  test("posts the request id, removes the request and notifies", async () => {
    const ctx = createCtx();
    const setAdminRequests = vi.fn();

    await handleApproveAdminRequest(adminRequest, setAdminRequests, ctx);

    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/admin/approve-admin-request"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: adminRequest.id }),
      }),
      expect.objectContaining({ serverStatus: "live" }),
    );
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.adminRequest.approveSuccess",
    });
    const updater = setAdminRequests.mock.calls[0]?.[0] as (
      prev: AdminRequest[],
    ) => AdminRequest[];
    expect(updater([adminRequest, { ...adminRequest, id: "other" }])).toEqual([
      { ...adminRequest, id: "other" },
    ]);
  });
});

describe("handleDeclineAdminRequest", () => {
  test("deletes the request, removes it from the list and notifies", async () => {
    const ctx = createCtx();
    const setAdminRequests = vi.fn();

    await handleDeclineAdminRequest(adminRequest, setAdminRequests, ctx);

    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/admin/decline-admin-request"),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ id: adminRequest.id }),
      }),
      expect.objectContaining({ serverStatus: "live" }),
    );
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.adminRequest.declineSuccess",
    });
    const updater = setAdminRequests.mock.calls[0]?.[0] as (
      prev: AdminRequest[],
    ) => AdminRequest[];
    expect(updater([adminRequest, { ...adminRequest, id: "other" }])).toEqual([
      { ...adminRequest, id: "other" },
    ]);
  });
});
