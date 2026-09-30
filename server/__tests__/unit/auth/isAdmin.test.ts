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

const { isAdmin } = await import("../../../src/auth/isAdmin.js");

function createMockResponse() {
  const statusMock = vi.fn().mockReturnThis();
  const jsonMock = vi.fn();

  const res = {
    status: statusMock,
    json: jsonMock,
  } as unknown as Response;

  return { res, statusMock, jsonMock };
}

describe("isAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("responds with status 401 when no session exists", async () => {
    getSessionMock.mockResolvedValue(null);

    const req = { headers: {} } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: "AUTH_REQUIRED",
        message: "Unauthorized: user not authenticated.",
      },
    });
  });

  test("calls next and sets authSession when role is ADMIN", async () => {
    const session = { user: { id: "1", role: "ADMIN" }, session: {} };
    getSessionMock.mockResolvedValue(session);

    const req = { headers: {} } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.authSession).toBe(session);
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  test("responds with status 403 when role is not ADMIN", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "1", role: "USER" },
      session: {},
    });

    const req = { headers: {} } as Request;
    const { res, statusMock, jsonMock } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await isAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: "FORBIDDEN",
        message: "Access denied: admin role is required.",
      },
    });
  });

  test("passes thrown errors to next", async () => {
    const authError = new Error("session lookup failed");
    getSessionMock.mockRejectedValue(authError);

    const req = { headers: {} } as Request;
    const { res } = createMockResponse();
    const next = vi.fn() as unknown as NextFunction;

    await isAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(authError);
  });
});
