import { handleLogout } from "../../../../../src/components/Profile/utils/handleLogout";
import {
  clearCsrfToken,
  getCsrfToken,
} from "../../../../../src/utils/getCsrfToken";
import { guardedFetch } from "../../../../../src/utils/guardedFetch";
import { ServerNotReadyError } from "../../../../../src/utils/serverStatus";

import type { RequestContext } from "../../../../../src/utils/apiMutation";

vi.mock("../../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../../src/utils/getCsrfToken")
    >();
  return { ...actual, getCsrfToken: vi.fn(), clearCsrfToken: vi.fn() };
});

vi.mock("../../../../../src/utils/guardedFetch", () => ({
  guardedFetch: vi.fn(),
}));

const mockedGetCsrfToken = vi.mocked(getCsrfToken);
const mockedClearCsrfToken = vi.mocked(clearCsrfToken);
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
  mockedClearCsrfToken.mockReset();
  mockedGuardedFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleLogout", () => {
  test("clears the session, navigates home and notifies", async () => {
    mockedGetCsrfToken.mockResolvedValue("csrf-token");
    mockedGuardedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Logged out." }),
    } as Response);
    const ctx = createCtx();
    const navigate = vi.fn();
    const setUserData = vi.fn();

    await handleLogout(navigate, setUserData, ctx);

    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/logout"),
      expect.objectContaining({ method: "POST" }),
      expect.objectContaining({ serverStatus: "live" }),
    );
    expect(setUserData).toHaveBeenCalledWith(null);
    expect(mockedClearCsrfToken).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/");
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.auth.logoutSuccess",
    });
  });

  test("does not notify when the server is not ready", async () => {
    mockedGetCsrfToken.mockRejectedValue(new ServerNotReadyError("waking"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const ctx = createCtx();

    await handleLogout(vi.fn(), vi.fn(), ctx);

    expect(ctx.addNotification).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
  });
});
