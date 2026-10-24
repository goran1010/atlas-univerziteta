import request from "supertest";
import { describe, test, expect, vi } from "vitest";

import { app } from "../../src/app.js";
import { logger } from "../../src/utils/logger.js";

// pino is mocked in mocks.setup.ts, so logger.info is a vi.fn
describe("request logging", () => {
  test("logs the path and keeps query strings (tokens, OAuth codes) out", async () => {
    vi.mocked(logger.info).mockClear();

    await request(app).get("/api?code=secret-oauth-code");

    const logged = vi
      .mocked(logger.info)
      .mock.calls.flat()
      .map(String)
      .join(" ");
    expect(logged).toContain("GET method to /api");
    expect(logged).not.toContain("secret-oauth-code");
  });
});
