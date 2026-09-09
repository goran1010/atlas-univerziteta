import request from "supertest";
import { vi } from "vitest";

// The global setup mocks csrf-sync into a pass-through so authenticated
// tests do not need tokens; this file tests the real protection.
vi.unmock("csrf-sync");

import { app } from "../../src/app.js";
import { describe, test, expect } from "vitest";
import { logger } from "../../src/utils/logger.js";

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

describe("CSRF Router", () => {
  test("should return a CSRF token", async () => {
    const response = await request(app).get("/csrf-token");
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["data"]).toBeTypeOf("string");
  });

  test("responds with 403 (not 500) to a mutation without a CSRF token", async () => {
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => logger);

    const response = await request(app).post("/users/request-admin");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "CSRF_TOKEN_INVALID",
        message: "invalid csrf token",
      },
    });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
