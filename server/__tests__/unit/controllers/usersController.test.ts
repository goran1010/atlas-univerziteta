import { describe, test, expect, vi, beforeEach } from "vitest";

import * as usersController from "../../../src/controllers/usersController.js";

import type { Request, Response } from "express";

describe("usersController.logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("responds with success message", () => {
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();

    const req = {} as Request;
    const res = { status: statusMock, json: jsonMock } as unknown as Response;

    usersController.logout(req, res);

    expect(jsonMock).toHaveBeenCalledWith({
      data: null,
      message: "User logged out successfully",
    });
  });
});
