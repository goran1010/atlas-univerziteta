import { describe, test, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import type { Request, Response, NextFunction } from "express";

beforeEach(() => {
  vi.resetModules();
});

describe("app", () => {
  test("app should be defined", async () => {
    const { app } = await import("../../src/app.js");
    expect(app).toBeDefined();
  });

  test("app responds with status 500 if an unexpected error occurs", async () => {
    vi.doMock("../../src/utils/rateLimiter.js", () => ({
      global: vi.fn((_req: Request, _res: Response, next: NextFunction) => {
        next();
      }),
      api: vi.fn(() => {
        throw new Error("Unexpected error");
      }),
      auth: vi.fn(),
      users: vi.fn(),
    }));
    const { app } = await import("../../src/app.js");

    const response = await request(app).get("/api");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Server error: please try again later.",
      },
    });
  });

  test("app responds with status 404 for unknown routes", async () => {
    const { app } = await import("../../src/app.js");

    const response = await request(app).get("/unknown-route");
    const expectedResponse = {
      status: 404,
      body: {
        error: {
          code: "NOT_FOUND",
          message: "Route not found: check the URL and HTTP method.",
        },
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});
