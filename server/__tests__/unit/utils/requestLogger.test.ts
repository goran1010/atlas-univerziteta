import { EventEmitter } from "node:events";
import { beforeEach, describe, test, expect, vi } from "vitest";

import { logger } from "../../../src/utils/logger.js";
import {
  loggablePath,
  requestLogger,
} from "../../../src/utils/requestLogger.js";

import type { Request, Response } from "express";

function runRequest({
  url = "/api",
  statusCode = 200,
  finished = true,
}: { url?: string; statusCode?: number; finished?: boolean } = {}) {
  const req = {
    method: "GET",
    originalUrl: url,
    ip: "203.0.113.7",
    get: (name: string) => (name === "user-agent" ? "test-agent" : undefined),
  } as unknown as Request;
  const res = Object.assign(new EventEmitter(), {
    statusCode,
    writableFinished: finished,
  }) as unknown as Response;
  const next = vi.fn();

  requestLogger(req, res, next);
  res.emit("close");

  return { next };
}

beforeEach(() => {
  vi.mocked(logger.info).mockClear();
  vi.mocked(logger.warn).mockClear();
});

describe("loggablePath", () => {
  test("drops the query string", () => {
    expect(
      loggablePath("/api/auth/verify-email?token=secret&callbackURL=/"),
    ).toBe("/api/auth/verify-email");
  });

  test("redacts the password-reset token in the path", () => {
    expect(
      loggablePath("/api/auth/reset-password/secret-token?callbackURL=/reset"),
    ).toBe("/api/auth/reset-password/[redacted]");
  });

  test("leaves other paths as they are", () => {
    expect(loggablePath("/api/v1/universities/42")).toBe(
      "/api/v1/universities/42",
    );
  });
});

describe("requestLogger", () => {
  test("logs one line with the status and duration once the response is sent", () => {
    const { next } = runRequest({ url: "/api/v1/search?q=zagreb" });

    expect(next).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      {
        method: "GET",
        path: "/api/v1/search",
        ip: "203.0.113.7",
        userAgent: "test-agent",
        status: 200,
        durationMs: expect.any(Number) as number,
      },
      "Request completed",
    );
  });

  test("logs a warning without a status when the connection closes first", () => {
    runRequest({ finished: false });

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      {
        method: "GET",
        path: "/api",
        ip: "203.0.113.7",
        userAgent: "test-agent",
        durationMs: expect.any(Number) as number,
      },
      "Request closed before the response was sent",
    );
  });

  test("skips successful health checks", () => {
    runRequest({ url: "/health" });
    runRequest({ url: "/health/" });

    expect(logger.info).not.toHaveBeenCalled();
  });

  test("logs failing health checks", () => {
    runRequest({ url: "/health", statusCode: 503 });

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/health", status: 503 }),
      "Request completed",
    );
  });
});
