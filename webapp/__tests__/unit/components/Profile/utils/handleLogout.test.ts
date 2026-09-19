import { handleLogout } from "../../../../../src/components/Profile/utils/handleLogout";
import {
  clearCsrfToken,
  getCsrfToken,
} from "../../../../../src/utils/getCsrfToken";

import type { RequestContext } from "../../../../../src/utils/apiMutation";

vi.mock("../../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../../src/utils/getCsrfToken")
    >();
  return { ...actual, getCsrfToken: vi.fn(), clearCsrfToken: vi.fn() };
});

const mockedGetCsrfToken = vi.mocked(getCsrfToken);
const mockedClearCsrfToken = vi.mocked(clearCsrfToken);
const fetchMock = vi.fn();

function createCtx(): RequestContext {
  return {
    addNotification: vi.fn(),
    setLoading: vi.fn(),
    t: (key: string) => key,
  };
}

beforeEach(() => {
  mockedGetCsrfToken.mockReset();
  mockedClearCsrfToken.mockReset();
  fetchMock.mockReset();
  mockedGetCsrfToken.mockResolvedValue("csrf-token");
  vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleLogout", () => {
  test("clears the session, navigates home and notifies", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Logged out." }),
    });
    const ctx = createCtx();
    const navigate = vi.fn();
    const setUserData = vi.fn();

    await handleLogout(navigate, setUserData, ctx);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/users/logout"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(setUserData).toHaveBeenCalledWith(null);
    expect(mockedClearCsrfToken).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/");
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.auth.logoutSuccess",
    });
  });
});
