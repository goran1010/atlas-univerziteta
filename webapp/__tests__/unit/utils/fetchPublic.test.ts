import { z } from "zod";
import {
  fetchPublic,
  fetchPublicResponse,
} from "../../../src/utils/fetchPublic";

const fetchMock = vi.fn();

const responseSchema = z.object({ data: z.object({ name: z.string() }) });

function createConfig(overrides = {}) {
  return {
    path: "/api/v1/example",
    responseSchema,
    errorMessageKey: "messages.example.error",
    logLabel: "load example",
    ...overrides,
  };
}

function createCtx() {
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

describe("fetchPublic", () => {
  test("returns the parsed result and toggles loading", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { name: "UNSA" } }),
    });
    const ctx = createCtx();

    const result = await fetchPublic(createConfig(), ctx);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/example"),
      expect.objectContaining({ method: "GET", mode: "cors" }),
    );
    expect(result).toEqual({ data: { name: "UNSA" } });
    expect(ctx.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
    expect(ctx.addNotification).not.toHaveBeenCalled();
  });

  test("maps a server error code to its message key and notifies", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      json: () =>
        Promise.resolve({
          error: { code: "RATE_LIMITED", message: "Too many requests." },
        }),
    });
    const ctx = createCtx();

    const result = await fetchPublic(createConfig(), ctx);

    expect(result).toBeNull();
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.apiError.rateLimited",
    });
  });

  test("notifies with the fallback key when the request throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const ctx = createCtx();

    const result = await fetchPublic(createConfig(), ctx);

    expect(result).toBeNull();
    expect(ctx.addNotification).toHaveBeenCalledWith({
      type: "error",
      message: "messages.example.error",
    });
    expect(ctx.setLoading).toHaveBeenLastCalledWith(false);
  });

  test("treats 404 as an expected state with quiet404", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({ error: { code: "NOT_FOUND", message: "Missing." } }),
    });
    const ctx = createCtx();

    const result = await fetchPublic(createConfig({ quiet404: true }), ctx);

    expect(result).toBeNull();
    expect(ctx.addNotification).not.toHaveBeenCalled();
  });
});

describe("fetchPublicResponse", () => {
  test("returns the status and parsed error body on failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({ error: { code: "OOPS", message: "Broke." } }),
    });

    const outcome = await fetchPublicResponse(
      "/api/v1/example",
      responseSchema,
    );

    expect(outcome).toEqual({
      ok: false,
      status: 500,
      error: { code: "OOPS", message: "Broke." },
    });
  });
});
