import { beforeEach, describe, expect, test, vi } from "vitest";

import { isAuthenticated } from "../../../src/auth/isAuthenticated.js";

import type { NextFunction, Request, Response } from "express";

function createMockResponse() {
  const statusMock = vi.fn().mockReturnThis();
  const jsonMock = vi.fn();

  const res = {
    status: statusMock,
    json: jsonMock,
  } as unknown as Response;

  return { res, statusMock, jsonMock };
}

describe("isAuthenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls next when req.user exists", () => {
    const req = {
      user: { id: "1", role: "USER" },
    } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  test("responds with status 401 when req.user is missing", () => {
    const req = {} as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    isAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("passes thrown errors to next", () => {
    const authError = new Error("auth middleware failed");
    const req = {} as Request;
    Object.defineProperty(req, "user", {
      configurable: true,
      get() {
        throw authError;
      },
    });
    const { res } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledWith(authError);
  });
});
