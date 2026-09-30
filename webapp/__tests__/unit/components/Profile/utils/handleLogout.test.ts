import { handleLogout } from "../../../../../src/components/Profile/utils/handleLogout";
import type { AddNotification } from "../../../../../src/types";

const signOutMock = vi.fn();

vi.mock("../../../../../src/utils/authClient", () => ({
  authClient: {
    signOut: (...args: unknown[]): unknown => signOutMock(...args),
  },
}));

function createCtx() {
  return {
    addNotification: vi.fn<AddNotification>(),
    setLoading: vi.fn<(loading: boolean) => void>(),
    t: (key: string) => key,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleLogout", () => {
  test("clears the session, navigates home and notifies", async () => {
    signOutMock.mockResolvedValue({ error: null });
    const ctx = createCtx();
    const navigate = vi.fn();
    const setUserData = vi.fn();

    await handleLogout(navigate, setUserData, ctx);

    expect(signOutMock).toHaveBeenCalled();
    expect(setUserData).toHaveBeenCalledWith(null);
    expect(navigate).toHaveBeenCalledWith("/");
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.auth.logoutSuccess",
    });
  });

  test("notifies on error and does not clear user data", async () => {
    signOutMock.mockResolvedValue({ error: { message: "Failed" } });
    const ctx = createCtx();
    const navigate = vi.fn();
    const setUserData = vi.fn();

    await handleLogout(navigate, setUserData, ctx);

    expect(setUserData).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.auth.logoutFailed",
    });
  });
});
