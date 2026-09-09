import { beforeEach, describe, expect, test, vi } from "vitest";

import { isNotAuthenticated } from "../../../src/auth/isNotAuthenticated.js";

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

describe("isNotAuthenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("calls next when req.user is missing", () => {
    const req = {} as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    isNotAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  test("responds with status 403 when req.user exists", () => {
    const req = {
      user: { id: "1", role: "USER" },
    } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    isNotAuthenticated(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: "ALREADY_LOGGED_IN",
        message: "Already logged in: log out first.",
      },
    });
  });
});
