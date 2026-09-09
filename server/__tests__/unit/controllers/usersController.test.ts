import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

import * as usersController from "../../../src/controllers/usersController.js";
import { logger } from "../../../src/utils/logger.js";

import type { Request, Response } from "express";

describe("usersController.logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("responds with status 500 when req.logout returns an error", () => {
    const logoutError = new Error("logout failed");
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const clearCookieMock = vi.fn();
    const destroyMock = vi.fn();
    const loggerErrorSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    const req = {
      logout: (callback: (err: Error | null) => void) => {
        callback(logoutError);
      },
      session: {
        destroy: destroyMock,
      },
    } as unknown as Request;

    const res = {
      status: statusMock,
      json: jsonMock,
      clearCookie: clearCookieMock,
    } as unknown as Response;

    usersController.logout(req, res);

    expect(loggerErrorSpy).toHaveBeenCalledWith(logoutError, "Logout failed.");
    expect(destroyMock).not.toHaveBeenCalled();
    expect(clearCookieMock).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: "LOGOUT_FAILED",
        message: "Logout failed: try again.",
      },
    });
  });

  test("responds with status 500 when req.session.destroy returns an error", () => {
    const destroyError = new Error("destroy failed");
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const clearCookieMock = vi.fn();
    const loggerErrorSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    const req = {
      logout: (callback: (err: Error | null) => void) => {
        callback(null);
      },
      session: {
        destroy: (callback: (err: Error | null) => void) => {
          callback(destroyError);
        },
      },
    } as unknown as Request;

    const res = {
      status: statusMock,
      json: jsonMock,
      clearCookie: clearCookieMock,
    } as unknown as Response;

    usersController.logout(req, res);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      destroyError,
      "Session destroy failed during logout.",
    );
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: {
        code: "LOGOUT_FAILED",
        message: "Logout failed: try again.",
      },
    });
    expect(clearCookieMock).not.toHaveBeenCalled();
  });
});
