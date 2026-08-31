import { handleDiscardUniversityChange } from "../../../../../src/components/ContributionDashboard/utils/handleDiscardUniversityChange";
import { getCsrfToken } from "../../../../../src/utils/getCsrfToken";
import { guardedFetch } from "../../../../../src/utils/guardedFetch";

import type { RequestContext } from "../../../../../src/utils/apiMutation";

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
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleDiscardUniversityChange", () => {
  test("removes the discarded change and shows a success notification", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ message: "Pending change deleted successfully." }),
    } as Response);
    const ctx = createCtx();
    const setPendingChanges = vi.fn();

    await handleDiscardUniversityChange("1", setPendingChanges, ctx);

    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pending-changes/universities"),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ id: "1" }),
      }),
      expect.objectContaining({ serverStatus: "live" }),
    );
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.universities.deleteSuccess",
    });

    const updater = setPendingChanges.mock.calls[0]?.[0] as (
      prev: { id: string }[],
    ) => { id: string }[];
    expect(updater([{ id: "1" }, { id: "2" }])).toEqual([{ id: "2" }]);
  });

  test("shows a translated error and keeps the list when discarding fails", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Discard failed." } }),
    } as Response);
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const ctx = createCtx();
    const setPendingChanges = vi.fn();

    await handleDiscardUniversityChange("1", setPendingChanges, ctx);

    expect(setPendingChanges).not.toHaveBeenCalled();
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.universities.deleteError",
    });
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});
