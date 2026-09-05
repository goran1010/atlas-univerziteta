import {
  SERVER_STATUS,
  ServerNotReadyError,
} from "../../../../../src/utils/serverStatus";
import type { SetStateAction } from "react";
import { CsrfTokenError } from "../../../../../src/utils/getCsrfToken";
import type { PendingChange } from "../../../../../src/schemas/pendingChange";
import type { GuardedFetch } from "../../../../../src/utils/guardedFetch";
import type { HandleSubmitUniversityEntityParams } from "../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity";

const getCsrfTokenMock = vi.fn<(args: unknown) => Promise<string>>();
const guardedFetchMock = vi.fn<GuardedFetch>();

vi.mock("../../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../../src/utils/getCsrfToken")
    >();
  return { ...actual, getCsrfToken: (args: unknown) => getCsrfTokenMock(args) };
});

vi.mock("../../../../../src/utils/guardedFetch", () => ({
  guardedFetch: (...args: Parameters<GuardedFetch>) =>
    guardedFetchMock(...args),
}));

const t = (key: string) => key;

const baseArgs = {
  entityType: "UNIVERSITY",
  parentId: "",
  targetId: "",
  typeOfChange: "CREATE" as const,
  data: {
    name: "University of Sarajevo",
    city: "Sarajevo",
    entity: "FBIH",
    ownership: "PUBLIC",
  },
  setPendingChanges: vi.fn(),
  setFormState: vi.fn(),
  ctx: {
    addNotification: vi.fn(),
    setLoading: vi.fn(),
    t,
    serverStatus: "live",
  },
} satisfies HandleSubmitUniversityEntityParams;

function createSuccessResponse(
  data: PendingChange | Partial<PendingChange>,
  message: string,
) {
  return {
    ok: true,
    json: () => Promise.resolve({ data, message }),
  } as Response;
}

function createErrorResponse(error: Record<string, unknown>) {
  return {
    ok: false,
    json: () => Promise.resolve(error),
  } as Response;
}

beforeEach(() => {
  getCsrfTokenMock.mockReset();
  guardedFetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleSubmitUniversityEntity", () => {
  test("uses POST with numeric parent id for create under parent entity", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockResolvedValue(
      createSuccessResponse(
        {
          id: "1",
          entityType: "FACULTY",
          typeOfChange: "CREATE",
          targetId: null,
          parentId: 15,
          data: { name: "Faculty of Law" },
          createdAt: new Date(),
          user: { email: "user@email.com", role: "USER" },
          userId: "user-1",
        },
        "Created.",
      ),
    );

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");

    await handleSubmitUniversityEntity({
      ...baseArgs,
      entityType: "FACULTY",
      parentId: "15",
      data: { name: "Faculty of Law" },
    });

    expect(guardedFetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          entityType: "FACULTY",
          parentId: 15,
          data: { name: "Faculty of Law" },
        }),
      }),
      expect.any(Object),
    );
  });

  test("submits a create request and prepends the pending change", async () => {
    const pendingChange: PendingChange = {
      id: "1",
      entityType: "UNIVERSITY",
      typeOfChange: "CREATE",
      targetId: null,
      parentId: null,
      data: {
        name: "University of Sarajevo",
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
      createdAt: new Date(),
      user: { email: "submitter@email.com", role: "USER" },
      userId: "user-1",
    };

    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockResolvedValue(
      createSuccessResponse(
        pendingChange,
        "Pending change created successfully.",
      ),
    );

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    let updatePendingChanges:
      | ((prev: PendingChange[]) => PendingChange[])
      | undefined;
    const setPendingChanges = (updater: SetStateAction<PendingChange[]>) => {
      if (typeof updater === "function") {
        updatePendingChanges = updater;
      }
    };
    const addNotification = vi.fn();
    const setLoading = vi.fn();
    const setFormState = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      setPendingChanges,
      setFormState,
      ctx: { addNotification, setLoading, t, serverStatus: "live" },
    });

    expect(guardedFetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/users/contribution/universities"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "csrf-token",
        },
      }),
      expect.objectContaining({ serverStatus: SERVER_STATUS.LIVE }),
    );
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.universities.addSuccess",
    });
    expect(setFormState).toHaveBeenCalledWith({
      entityType: "",
      parentId: "",
      targetId: "",
      data: {},
    });

    expect(typeof updatePendingChanges).toBe("function");

    const existingPendingChange: PendingChange = {
      ...pendingChange,
      id: "existing",
    };

    expect(
      (updatePendingChanges as (prev: PendingChange[]) => PendingChange[])([
        existingPendingChange,
      ]),
    ).toEqual([pendingChange, existingPendingChange]);
  });

  test("uses PUT and target id for updates", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockResolvedValue(
      createSuccessResponse(
        {
          id: "1",
          entityType: "FACULTY",
          typeOfChange: "UPDATE",
          targetId: 7,
          parentId: null,
          data: { name: "Updated Faculty" },
          createdAt: new Date(),
          user: { email: "user@email.com", role: "USER" },
          userId: "user-1",
        },
        "Updated.",
      ),
    );

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");

    await handleSubmitUniversityEntity({
      ...baseArgs,
      entityType: "FACULTY",
      targetId: "7",
      typeOfChange: "UPDATE",
      data: { name: "Updated Faculty" },
    });

    expect(guardedFetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          entityType: "FACULTY",
          targetId: 7,
          data: { name: "Updated Faculty" },
        }),
      }),
      expect.any(Object),
    );
  });

  test("uses DELETE and target id for delete changes", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockResolvedValue(
      createSuccessResponse(
        {
          id: "1",
          entityType: "TRACK",
          typeOfChange: "DELETE",
          targetId: 42,
          parentId: null,
          data: {},
          createdAt: new Date(),
          user: { email: "user@email.com", role: "USER" },
          userId: "user-1",
        },
        "Deleted.",
      ),
    );

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");

    await handleSubmitUniversityEntity({
      ...baseArgs,
      entityType: "TRACK",
      targetId: "42",
      typeOfChange: "DELETE",
      data: {},
    });

    expect(guardedFetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          entityType: "TRACK",
          targetId: 42,
        }),
      }),
      expect.any(Object),
    );
  });

  test("does not notify again when fetching the csrf token fails", async () => {
    getCsrfTokenMock.mockRejectedValue(
      new CsrfTokenError(new Error("token endpoint down")),
    );

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    const addNotification = vi.fn();
    const setLoading = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      ctx: { addNotification, setLoading, t, serverStatus: "live" },
    });

    expect(guardedFetchMock).not.toHaveBeenCalled();
    expect(addNotification).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  test("does not request a CSRF token or submit an invalid target ID", async () => {
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    const addNotification = vi.fn();

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");

    await handleSubmitUniversityEntity({
      ...baseArgs,
      entityType: "FACULTY",
      targetId: "not-a-number",
      typeOfChange: "UPDATE",
      data: { name: "Updated Faculty" },
      ctx: { addNotification, setLoading: vi.fn(), t, serverStatus: "live" },
    });

    expect(getCsrfTokenMock).not.toHaveBeenCalled();
    expect(guardedFetchMock).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
  });

  test("does not add a change when a successful response has invalid data", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          message: "Suggestion submitted.",
          data: { id: "pending-change-1" },
        }),
    } as Response);
    const setPendingChanges = vi.fn();
    const addNotification = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");

    await handleSubmitUniversityEntity({
      ...baseArgs,
      setPendingChanges,
      ctx: { addNotification, setLoading: vi.fn(), t, serverStatus: "live" },
    });

    expect(setPendingChanges).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("falls back to the generic add error when the backend error payload is missing", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockResolvedValue(createErrorResponse({}));

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    const addNotification = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      ctx: { addNotification, setLoading: vi.fn(), t, serverStatus: "live" },
    });

    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
  });

  test("shows the fallback error when the request throws", async () => {
    const requestError = new Error("Network failure");
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockRejectedValue(requestError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    const addNotification = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      ctx: { addNotification, setLoading: vi.fn(), t, serverStatus: "live" },
    });

    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error trying to submit university change:",
      requestError,
    );
  });

  test("does not notify when the server is not ready", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    guardedFetchMock.mockRejectedValue(
      new ServerNotReadyError(SERVER_STATUS.WAKING),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    const addNotification = vi.fn();
    const setLoading = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      ctx: { addNotification, setLoading, t, serverStatus: "live" },
    });

    expect(addNotification).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
