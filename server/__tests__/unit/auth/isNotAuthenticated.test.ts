import { beforeEach, describe, expect, test, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

const getSessionMock = vi.fn();

vi.mock("../../../src/config/auth.js", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]): unknown => getSessionMock(...args),
    },
  },
}));

vi.mock("better-auth/node", () => ({
  fromNodeHeaders: (headers: unknown) => headers,
}));

const { isNotAuthenticated } =
  await import("../../../src/auth/isNotAuthenticated.js");

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

  test("calls next when no session exists", async () => {
    getSessionMock.mockResolvedValue(null);

    const req = { headers: {} } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await isNotAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  test("responds with status 403 when session exists", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "1", role: "USER" },
      session: {},
    });

    const req = { headers: {} } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await isNotAuthenticated(req, res, next);

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
