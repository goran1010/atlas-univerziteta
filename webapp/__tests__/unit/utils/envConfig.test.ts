beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("envConfig", () => {
  test("should have the correct environment variables", async () => {
    vi.stubEnv("VITE_API_URL", "https://example.com");

    const { API_URL } = await import("../../../src/utils/envConfig");

    expect(API_URL).toBe("https://example.com");
  });

  test("should throw an error if VITE_API_URL is not defined", async () => {
    vi.stubEnv("VITE_API_URL", undefined);

    await expect(async () => {
      await import("../../../src/utils/envConfig");
    }).rejects.toThrow("VITE_API_URL is not defined in environment variables");
  });

  test("should use VITE_PUBLIC_API_URL when set", async () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    vi.stubEnv("VITE_PUBLIC_API_URL", "https://api.example.com");

    const { PUBLIC_API_URL } = await import("../../../src/utils/envConfig");

    expect(PUBLIC_API_URL).toBe("https://api.example.com");
  });

  test("should fall back to VITE_API_URL when VITE_PUBLIC_API_URL is not set", async () => {
    vi.stubEnv("VITE_API_URL", "https://example.com");
    vi.stubEnv("VITE_PUBLIC_API_URL", undefined);

    const { PUBLIC_API_URL } = await import("../../../src/utils/envConfig");

    expect(PUBLIC_API_URL).toBe("https://example.com");
  });

  test("should use VITE_SENTRY_DSN when set", async () => {
    vi.stubEnv("VITE_API_URL", "https://example.com");
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@o1.ingest.de.sentry.io/2");

    const { SENTRY_DSN } = await import("../../../src/utils/envConfig");

    expect(SENTRY_DSN).toBe("https://key@o1.ingest.de.sentry.io/2");
  });

  test("should leave SENTRY_DSN undefined when VITE_SENTRY_DSN is empty", async () => {
    vi.stubEnv("VITE_API_URL", "https://example.com");
    vi.stubEnv("VITE_SENTRY_DSN", "");

    const { SENTRY_DSN } = await import("../../../src/utils/envConfig");

    expect(SENTRY_DSN).toBeUndefined();
  });
});
