import { handleLogout } from "../../../../../src/components/Profile/utils/handleLogout";
import type { RequestContext } from "../../../../../src/utils/apiMutation";

const fetchMock = vi.fn();

function createCtx(): RequestContext {
  return {
    addNotification: vi.fn(),
    setLoading: vi.fn(),
    t: (key: string) => key,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
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
    expect(navigate).toHaveBeenCalledWith("/");
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.auth.logoutSuccess",
    });
  });
});
