import request from "supertest";
import { describe, test, expect, vi, beforeEach } from "vitest";

import type { User } from "../../../src/generated/prisma/client.js";
import type { Request, Response, NextFunction } from "express";

type ExpressUser = Omit<User, "password">;

let mockedUser: ExpressUser | undefined = undefined;

type ImportOriginalMock = Record<string, unknown>;
type ImportOriginal = () => Promise<ImportOriginalMock>;

vi.mock(
  "../../../src/config/passport.js",
  async (importOriginal: ImportOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      passport: {
        session: () => {
          return (req: Request, _res: Response, next: NextFunction) => {
            req.user = mockedUser;
            next();
          };
        },
      },
    };
  },
);

import { app } from "../../../src/app.js";

beforeEach(() => {
  vi.clearAllMocks();
  mockedUser = undefined;
});

describe("GET /me", () => {
  test("responds with status 401 and You are not logged in if not logged in", async () => {
    const notLoggedInResponse = {
      message: "No user logged in",
      data: null,
    };

    const response = await request(app).get("/users/me");
    const expectedResponse = {
      status: 200,
      body: notLoggedInResponse,
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });

  test("responds with status 200 and user info if logged in", async () => {
    mockedUser = {
      id: "1",
      email: "test@example.com",
      role: "USER",
      githubId: null,
      googleId: null,
      adminRequestedAt: null,
    };

    const response = await request(app).get("/users/me");
    const expectedResponse = {
      status: 200,
      body: {
        data: mockedUser,
        message: "User info retrieved",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});
