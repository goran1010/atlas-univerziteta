import { z } from "zod";
import { apiMutation } from "../../../src/utils/apiMutation";
import { CsrfTokenError } from "../../../src/utils/getCsrfToken";
import { getCsrfToken } from "../../../src/utils/getCsrfToken";
import { guardedFetch } from "../../../src/utils/guardedFetch";
import { ServerNotReadyError } from "../../../src/utils/serverStatus";

import type { RequestContext } from "../../../src/utils/apiMutation";

vi.mock("../../../src/utils/getCsrfToken", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/utils/getCsrfToken")>();
  return { ...actual, getCsrfToken: vi.fn() };
});

vi.mock("../../../src/utils/guardedFetch", () => ({
  guardedFetch: vi.fn(),
}));

const mockedGetCsrfToken = vi.mocked(getCsrfToken);
const mockedGuardedFetch = vi.mocked(guardedFetch);

const responseSchema = z.object({ message: z.string() });

function createConfig(overrides = {}) {
  return {
    path: "/example-path",
    method: "POST" as const,
    body: { id: "change-1" },
    responseSchema,
    successMessageKey: "messages.example.success",
    errorMessageKey: "messages.example.error",
    logLabel: "run example action",
    ...overrides,
  };
}

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

describe("apiMutation", () => {
  test("sends the request, notifies and returns the parsed result", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Done." }),
    } as Response);
    const ctx = createCtx();

    const result = await apiMutation(createConfig(), ctx);

    expect(mockedGuardedFetch).toHaveBeenCalledWith(
      expect.stringContaining("/example-path"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": "csrf-token",
        },
        body: JSON.stringify({ id: "change-1" }),
        credentials: "include",
      }),
      expect.objectContaining({ serverStatus: "live" }),
    );
    expect(result).toEqual({ message: "Done." });
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "success",
      message: "messages.example.success",
    });
    expect(ctx.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
  });

  test("omits the body when the config has none", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Done." }),
    } as Response);

    await apiMutation(createConfig({ body: undefined }), createCtx());

    const [, options] = mockedGuardedFetch.mock.calls[0] ?? [];
    expect(options).not.toHaveProperty("body");
  });

  test("notifies with the error message on a failed response", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({ error: { message: "Rejected on the server." } }),
    } as Response);
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const ctx = createCtx();

    const result = await apiMutation(createConfig(), ctx);

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to run example action:",
      "Rejected on the server.",
    );
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.example.error",
    });
  });

  test("still notifies when a failed response has a non-JSON body", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("invalid JSON")),
    } as Response);
    const ctx = createCtx();

    await apiMutation(createConfig(), ctx);

    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.example.error",
    });
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
  });

  test("returns null when a successful response is malformed", async () => {
    mockedGuardedFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const ctx = createCtx();

    const result = await apiMutation(createConfig(), ctx);

    expect(result).toBeNull();
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.example.error",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  test("uses the caught-error message when the request throws", async () => {
    const requestError = new Error("Network failure");
    mockedGuardedFetch.mockRejectedValue(requestError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const ctx = createCtx();

    await apiMutation(
      createConfig({ caughtErrorMessageKey: "messages.example.caught" }),
      ctx,
    );

    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.example.caught",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error trying to run example action:",
      requestError,
    );
  });

  test("does not notify when the server is not ready", async () => {
    mockedGuardedFetch.mockRejectedValue(new ServerNotReadyError("waking"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const ctx = createCtx();

    const result = await apiMutation(createConfig(), ctx);

    expect(result).toBeNull();
    expect(ctx.addNotification).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
  });

  test("does not notify again when fetching the csrf token fails", async () => {
    mockedGetCsrfToken.mockRejectedValue(
      new CsrfTokenError(new Error("token endpoint down")),
    );
    const ctx = createCtx();

    const result = await apiMutation(createConfig(), ctx);

    expect(result).toBeNull();
    expect(mockedGuardedFetch).not.toHaveBeenCalled();
    expect(ctx.addNotification).not.toHaveBeenCalled();
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
  });
});
