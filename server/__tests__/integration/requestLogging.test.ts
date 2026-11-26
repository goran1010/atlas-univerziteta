import request from "supertest";
import { beforeEach, describe, test, expect, vi } from "vitest";

import { app } from "../../src/app.js";
import { logger } from "../../src/utils/logger.js";

// pino is mocked in mocks.setup.ts, so the logger methods are vi.fn
function everythingLogged() {
  return [logger.info, logger.warn, logger.error]
    .flatMap((method) => vi.mocked(method).mock.calls)
    .map((call) => JSON.stringify(call))
    .join(" ");
}

beforeEach(() => {
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.error).mockClear();
});

describe("request logging", () => {
  test("logs the request once it completes, without the query string", async () => {
    await request(app)
      .get("/api?code=secret-oauth-code")
      .set("User-Agent", "request-logging-test");

    await vi.waitFor(() => {
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          path: "/api",
          status: 200,
          userAgent: "request-logging-test",
        }),
        "Request completed",
      );
    });
    expect(everythingLogged()).not.toContain("secret-oauth-code");
  });

  test("keeps the password-reset token out of the logs", async () => {
    await request(app).get(
      "/api/auth/reset-password/secret-reset-token?callbackURL=/reset-password",
    );

    await vi.waitFor(() => {
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/auth/reset-password/[redacted]",
        }),
        "Request completed",
      );
    });
    expect(everythingLogged()).not.toContain("secret-reset-token");
  });
});
