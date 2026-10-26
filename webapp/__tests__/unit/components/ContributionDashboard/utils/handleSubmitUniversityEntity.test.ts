import {
  handleSubmitUniversityEntity,
  buildEditDelta,
} from "../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity";
import { makeUser } from "../../../../utils/makeUser";

import type { PendingChange } from "../../../../../src/schemas/pendingChange";
import type { HandleSubmitUniversityEntityParams } from "../../../../../src/components/ContributionDashboard/utils/handleSubmitUniversityEntity";

const fetchMock = vi.fn();

const t = (key: string) => key;

const baseArgs = {
  targetType: "UNIVERSITY",
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

function makePendingChange(
  overrides: Partial<PendingChange> = {},
): Partial<PendingChange> {
  // the spread over a discriminated union widens the discriminants, so the
  // factory result is cast back; the schema parse in the code under test
  // validates the runtime shape anyway
  return {
    id: "1",
    targetType: "UNIVERSITY",
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
    user: makeUser({ email: "user@email.com" }),
    userId: "user-1",
    ...overrides,
  } as Partial<PendingChange>;
}

function createSuccessResponse(
  data: PendingChange | Partial<PendingChange>,
  message = "Suggestion submitted.",
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
  fetchMock.mockReset();
  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleSubmitUniversityEntity", () => {
  test("uses POST with numeric parent id for create under parent entity", async () => {
    fetchMock.mockResolvedValue(
      createSuccessResponse(
        makePendingChange({
          targetType: "FACULTY",
          parentId: 15,
          data: { name: "Faculty of Law" },
        }),
      ),
    );

    await handleSubmitUniversityEntity({
      ...baseArgs,
      targetType: "FACULTY",
      parentId: "15",
      data: { name: "Faculty of Law" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          targetType: "FACULTY",
          parentId: 15,
          data: { name: "Faculty of Law" },
        }),
      }),
    );
  });

  test("submits a create request and calls onSuccess", async () => {
    fetchMock.mockResolvedValue(createSuccessResponse(makePendingChange()));
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
    fetchMock.mockResolvedValue(
      createSuccessResponse(
        makePendingChange({
          targetType: "FACULTY",
          typeOfChange: "UPDATE",
          targetId: 7,
          data: { name: "Updated Faculty" },
        }),
      ),
    );

    await handleSubmitUniversityEntity({
      ...baseArgs,
      targetType: "FACULTY",
      targetId: "7",
      typeOfChange: "UPDATE",
      data: { name: "Updated Faculty" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          targetType: "FACULTY",
          targetId: 7,
          data: { name: "Updated Faculty" },
        }),
      }),
    );
  });

  test("uses DELETE and target id for delete changes", async () => {
    fetchMock.mockResolvedValue(
      createSuccessResponse(
        makePendingChange({
          targetType: "TRACK",
          typeOfChange: "DELETE",
          targetId: 42,
          data: {},
        }),
      ),
    );

    await handleSubmitUniversityEntity({
      ...baseArgs,
      targetType: "TRACK",
      targetId: "42",
      typeOfChange: "DELETE",
      data: {},
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          targetType: "TRACK",
          targetId: 42,
        }),
      }),
    );
  });

  test("does not submit an invalid target ID", async () => {
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    const addNotification = vi.fn();

    await handleSubmitUniversityEntity({
      ...baseArgs,
      targetType: "FACULTY",
      targetId: "not-a-number",
      typeOfChange: "UPDATE",
      data: { name: "Updated Faculty" },
      ctx: { addNotification, setLoading: vi.fn(), t },
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.addError",
    });
  });

  test("does not call onSuccess when a successful response has invalid data", async () => {
    fetchMock.mockResolvedValue(
      createSuccessResponse({ id: "pending-change-1" }),
    );
    const onSuccess = vi.fn();
    const addNotification = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

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
    fetchMock.mockResolvedValue(createErrorResponse({}));
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
    fetchMock.mockRejectedValue(requestError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
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

describe("buildEditDelta", () => {
  const baseline = {
    name: "Faculty of Science",
    city: "Sarajevo",
    website: "https://pmf.example",
  };

  test("includes only changed fields", () => {
    expect(
      buildEditDelta({ ...baseline, city: "Mostar" }, baseline, "FACULTY"),
    ).toEqual({ city: "Mostar" });
  });

  test("sends null for an emptied clearable field", () => {
    expect(
      buildEditDelta({ ...baseline, website: undefined }, baseline, "FACULTY"),
    ).toEqual({ website: null });
  });

  test("treats an emptied non-clearable field as unchanged", () => {
    expect(
      buildEditDelta({ ...baseline, name: "" }, baseline, "FACULTY"),
    ).toEqual({});
  });

  test("compares numeric fields by value", () => {
    expect(
      buildEditDelta(
        { name: "Track", ects: 60 },
        { name: "Track", ects: 60 },
        "TRACK",
      ),
    ).toEqual({});
    expect(
      buildEditDelta(
        { name: "Track", ects: 30 },
        { name: "Track", ects: 60 },
        "TRACK",
      ),
    ).toEqual({ ects: 30 });
  });

  test("ignores fields absent from both draft and baseline", () => {
    expect(buildEditDelta({ name: "Same" }, { name: "Same" }, "TRACK")).toEqual(
      {},
    );
  });
});
