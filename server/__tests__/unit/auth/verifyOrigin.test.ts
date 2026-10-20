import { beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

vi.mock("../../../src/config/env.js", () => ({
  env: { WEBAPP_URL: "https://webapp.example" },
}));

const { verifyOrigin } = await import("../../../src/auth/verifyOrigin.js");

function createMockResponse() {
  const statusMock = vi.fn().mockReturnThis();
  const jsonMock = vi.fn();

  const res = {
    status: statusMock,
    json: jsonMock,
  } as unknown as Response;

  return { res, statusMock, jsonMock };
}

function createRequest(method: string, origin?: string) {
  return {
    method,
    headers: origin === undefined ? {} : { origin },
  } as Request;
}

describe("verifyOrigin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls next for GET even with a mismatched origin", () => {
    const req = createRequest("GET", "https://evil.example");
    const { res, statusMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    verifyOrigin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  test("calls next for POST without an Origin header", () => {
    const req = createRequest("POST");
    const { res, statusMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    verifyOrigin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  test("calls next for POST with a matching origin", () => {
    const req = createRequest("POST", "https://webapp.example");
    const { res, statusMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    verifyOrigin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  test("responds with status 403 for POST with a mismatched origin", () => {
    const req = createRequest("POST", "https://evil.example");
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    verifyOrigin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: "FORBIDDEN",
        message: "Request origin is not allowed.",
      },
    });
  });

  test("responds with status 403 for DELETE with a mismatched origin", () => {
    const req = createRequest("DELETE", "https://evil.example");
    const { res, statusMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    verifyOrigin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
  });
});
