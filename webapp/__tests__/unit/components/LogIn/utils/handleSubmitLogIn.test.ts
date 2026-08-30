import { ServerNotReadyError } from "../../../../../src/utils/serverStatus";

import type { SubmitEvent } from "react";

const getCsrfTokenMock = vi.fn<(args: unknown) => Promise<string | null>>();
const guardedFetchMock =
  vi.fn<
    (url: unknown, options: unknown, context: unknown) => Promise<Response>
  >();

vi.mock("../../../../../src/utils/getCsrfToken", () => ({
  getCsrfToken: (args: unknown) => getCsrfTokenMock(args),
  clearCsrfToken: vi.fn(),
}));

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

describe("handleSubmitLogIn", () => {
  test("does not notify when the server is not ready", async () => {
    getCsrfTokenMock.mockRejectedValue(new ServerNotReadyError("waking"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { handleSubmitLogIn } =
      await import("../../../../../src/components/LogIn/utils/handleSubmitLogIn");
    const addNotification = vi.fn();
    const setLoading = vi.fn();

    await handleSubmitLogIn(
      submitEvent,
      { email: "user@example.com", password: "password123" },
      vi.fn(),
      addNotification,
      setLoading,
      vi.fn(),
      t,
      "live",
    );

    expect(addNotification).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
