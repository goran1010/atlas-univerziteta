import { CsrfTokenError } from "../../../../../src/utils/getCsrfToken";
import type { PendingChange } from "../../../../../src/schemas/pendingChange";
import type { HandleSubmitUniversityEntityParams } from "../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity";

const getCsrfTokenMock = vi.fn<(args: unknown) => Promise<string>>();
const fetchMock = vi.fn();

vi.mock("../../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../../src/utils/getCsrfToken")
    >();
  return { ...actual, getCsrfToken: (args: unknown) => getCsrfTokenMock(args) };
});

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
  onSuccess: vi.fn(),
  ctx: {
    addNotification: vi.fn(),
    setLoading: vi.fn(),
    t,
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
  fetchMock.mockReset();
  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleSubmitUniversityEntity", () => {
  test("uses POST with numeric parent id for create under parent entity", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    fetchMock.mockResolvedValue(
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

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          entityType: "FACULTY",
          parentId: 15,
          data: { name: "Faculty of Law" },
        }),
      }),
    );
  });

  test("submits a create request and calls onSuccess", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    fetchMock.mockResolvedValue(
      createSuccessResponse(
        {
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
        },
        "Pending change created successfully.",
      ),
    );

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    const addNotification = vi.fn();
    const setLoading = vi.fn();
    const onSuccess = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      onSuccess,
      ctx: { addNotification, setLoading, t },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/users/contribution/universities"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "csrf-token",
        },
      }),
    );
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.universities.addSuccess",
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  test("uses PUT and target id for updates", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    fetchMock.mockResolvedValue(
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

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          entityType: "FACULTY",
          targetId: 7,
          data: { name: "Updated Faculty" },
        }),
      }),
    );
  });

  test("uses DELETE and target id for delete changes", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    fetchMock.mockResolvedValue(
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

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          entityType: "TRACK",
          targetId: 42,
        }),
      }),
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
      ctx: { addNotification, setLoading, t },
    });

    expect(fetchMock).not.toHaveBeenCalled();
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
      ctx: { addNotification, setLoading: vi.fn(), t },
    });

    expect(getCsrfTokenMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
  });

  test("does not call onSuccess when a successful response has invalid data", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          message: "Suggestion submitted.",
          data: { id: "pending-change-1" },
        }),
    });
    const onSuccess = vi.fn();
    const addNotification = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");

    await handleSubmitUniversityEntity({
      ...baseArgs,
      onSuccess,
      ctx: { addNotification, setLoading: vi.fn(), t },
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("falls back to the generic add error when the backend error payload is missing", async () => {
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    fetchMock.mockResolvedValue(createErrorResponse({}));

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    const addNotification = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      ctx: { addNotification, setLoading: vi.fn(), t },
    });

    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
  });

  test("shows the fallback error when the request throws", async () => {
    const requestError = new Error("Network failure");
    getCsrfTokenMock.mockResolvedValue("csrf-token");
    fetchMock.mockRejectedValue(requestError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { handleSubmitUniversityEntity } =
      await import("../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity");
    const addNotification = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      ctx: { addNotification, setLoading: vi.fn(), t },
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
});
