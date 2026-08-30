import { ServerNotReadyError } from "../../../../../src/utils/serverStatus";

import type { SubmitEvent } from "react";

const getCsrfTokenMock = vi.fn<(args: unknown) => Promise<string | null>>();
const guardedFetchMock =
  vi.fn<
    (url: unknown, options: unknown, context: unknown) => Promise<Response>
  >();

vi.mock("../../../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../../../src/utils/getCsrfToken")
    >();
  return {
    ...actual,
    getCsrfToken: (args: unknown) => getCsrfTokenMock(args),
  };
});

vi.mock("../../../../../src/utils/guardedFetch", () => ({
  guardedFetch: (url: unknown, options: unknown, context: unknown) =>
    guardedFetchMock(url, options, context),
}));

const t = (key: string) => key;
const submitEvent = {
  preventDefault: vi.fn(),
} as unknown as SubmitEvent<HTMLFormElement>;

beforeEach(() => {
  getCsrfTokenMock.mockReset();
  guardedFetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleSignUpSubmit", () => {
  test("does not notify when the server is not ready", async () => {
    getCsrfTokenMock.mockRejectedValue(new ServerNotReadyError("waking"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { handleSignUpSubmit } =
      await import("../../../../../src/components/SignUp/utils/handleSignUpSubmit");
    const addNotification = vi.fn();
    const setLoading = vi.fn();

    await handleSignUpSubmit(
      submitEvent,
      {
        email: "user@example.com",
        password: "password123",
        "confirm-password": "password123",
      },
      vi.fn(),
      { addNotification, setLoading, t, serverStatus: "live" },
    );

    expect(addNotification).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
