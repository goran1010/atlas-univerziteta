import { beforeEach, afterEach, describe, test, expect, vi } from "vitest";

const originalEnv = { ...process.env };

function setRequiredEnv() {
  process.env["DATABASE_URL"] = "postgres://localhost:5432/app";
  process.env["WEBAPP_URL"] = "http://localhost:5173";
  process.env["SERVER_URL"] = "http://localhost:3000";
  process.env["PORT"] = "3000";
  process.env["RESEND_API_KEY"] = "resend-key";
  process.env["COOKIE_SECRET"] = "cookie-secret";
  process.env["GITHUB_CLIENT_ID"] = "github-client-id";
  process.env["GITHUB_CLIENT_SECRET"] = "github-client-secret";
  process.env["GITHUB_CALLBACK_URL"] =
    "http://localhost:3000/auth/github/callback";
}

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  setRequiredEnv();
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("env config", () => {
  test("loads environment variables and parses PORT as a number", async () => {
    const { env } = await import("../../../src/config/env.js");

    expect(env.DATABASE_URL).toBe("postgres://localhost:5432/app");
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("test");
  });

  test("throws if DATABASE_URL is missing", async () => {
    delete process.env["DATABASE_URL"];
    vi.resetModules();

    await expect(import("../../../src/config/env.js")).rejects.toThrow(
      "Missing environment variable: DATABASE_URL",
    );
  });

  test("throws if PORT is not a number", async () => {
    process.env["PORT"] = "not-a-number";
    vi.resetModules();

    await expect(import("../../../src/config/env.js")).rejects.toThrow(
      "Environment variable PORT must be a number",
    );
  });

  test("throws if TEST_DATABASE_URL is missing in test environment", async () => {
    process.env["NODE_ENV"] = "test";
    delete process.env["TEST_DATABASE_URL"];
    vi.resetModules();

    await expect(import("../../../src/config/env.js")).rejects.toThrow(
      "Missing environment variable for test environment: TEST_DATABASE_URL",
    );
  });

  test("defaults RESEND_FROM_EMAIL to onboarding@resend.dev", async () => {
    delete process.env["RESEND_FROM_EMAIL"];
    vi.resetModules();

    const { env } = await import("../../../src/config/env.js");
    expect(env.RESEND_FROM_EMAIL).toBe("onboarding@resend.dev");
  });

  test("uses RESEND_FROM_EMAIL when set", async () => {
    process.env["RESEND_FROM_EMAIL"] = "noreply@atlasuniverziteta.ba";
    vi.resetModules();

    const { env } = await import("../../../src/config/env.js");
    expect(env.RESEND_FROM_EMAIL).toBe("noreply@atlasuniverziteta.ba");
  });

  test("throws if NODE_ENV is invalid", async () => {
    process.env["NODE_ENV"] = "staging";
    vi.resetModules();

    await expect(import("../../../src/config/env.js")).rejects.toThrow(
      "NODE_ENV must be one of: development, test, production",
    );
  });
});
