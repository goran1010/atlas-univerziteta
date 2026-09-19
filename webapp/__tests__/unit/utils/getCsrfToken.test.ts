beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getCsrfToken", () => {
  test("returns the CSRF token when response is ok", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mockResponse = new Response(
      JSON.stringify({
        message: "CSRF token generated successfully",
        data: "test-csrf-token",
      }),
      { status: 200 },
    );
    fetchSpy.mockResolvedValue(mockResponse);
    const { getCsrfToken } = await import("../../../src/utils/getCsrfToken");
    const result = await getCsrfToken({
      addNotification: () => vi.fn(),
      t: (key) => key,
    });

    expect(result).toBe("test-csrf-token");
  });

  test("calls fetch with cors mode and credentials included", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mockResponse = new Response(
      JSON.stringify({
        message: "CSRF token generated successfully",
        data: "test-csrf-token",
      }),
      { status: 200 },
    );
    fetchSpy.mockResolvedValue(mockResponse);

    const { getCsrfToken } = await import("../../../src/utils/getCsrfToken");

    await getCsrfToken({
      addNotification: () => vi.fn(),
      t: (key) => key,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ mode: "cors", credentials: "include" }),
    );
  });

  test("throws an Error when fetch throws", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockRejectedValue(new Error("Network failure"));
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    const { getCsrfToken } = await import("../../../src/utils/getCsrfToken");

    await expect(
      getCsrfToken({
        addNotification: () => vi.fn(),
        t: (key) => key,
      }),
    ).rejects.toThrow("Failed to fetch CSRF token");
  });

  test("logs the error to console when fetch throws", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const networkError = new Error("Network failure");
    fetchSpy.mockRejectedValue(networkError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => vi.fn());
    const { getCsrfToken } = await import("../../../src/utils/getCsrfToken");

    await expect(
      getCsrfToken({
        addNotification: () => vi.fn(),
        t: (key) => key,
      }),
    ).rejects.toThrow("Failed to fetch CSRF token");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching CSRF token:",
      networkError,
    );
  });

  test("throws when a successful response has an invalid payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: "test-csrf-token" }), {
        status: 200,
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    const { getCsrfToken } = await import("../../../src/utils/getCsrfToken");

    await expect(
      getCsrfToken({
        addNotification: () => vi.fn(),
        t: (key) => key,
      }),
    ).rejects.toThrow("Failed to fetch CSRF token");
  });
});

describe("clearCsrfToken", () => {
  test("clears the cached CSRF token", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            message: "CSRF token generated successfully",
            data: "test-csrf-token",
          }),
          { status: 200 },
        ),
      ),
    );
    const { getCsrfToken, clearCsrfToken } =
      await import("../../../src/utils/getCsrfToken");

    await getCsrfToken({
      addNotification: () => vi.fn(),
      t: (key) => key,
    });

    clearCsrfToken();

    await getCsrfToken({
      addNotification: () => vi.fn(),
      t: (key) => key,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
