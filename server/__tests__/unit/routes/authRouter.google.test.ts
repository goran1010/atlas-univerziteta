import request from "supertest";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { env } from "../../../src/config/env.js";

import type { Request, Response, NextFunction } from "express";

type AuthenticateHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

type AuthenticateMock = (
  strategy: string,
  optionsOrCallback?: unknown,
  maybeCallback?: unknown,
) => AuthenticateHandler;

type GoogleAuthCallback = (
  err: unknown,
  user: Express.User | false | null,
) => void;

type PassportModule = typeof import("../../../src/config/passport.js");

const authenticateMock = vi.fn<AuthenticateMock>(
  () => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
);

vi.mock("../../../src/config/passport.js", async (importOriginal) => {
  const actual = await importOriginal<PassportModule>();
  actual.passport.authenticate =
    authenticateMock as typeof actual.passport.authenticate;

  return {
    ...actual,
    passport: actual.passport,
  };
});

const { app } = await import("../../../src/app.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Auth Router - GET /auth/google", () => {
  test("responds with status 302 and redirects to Google for authentication", async () => {
    authenticateMock.mockImplementation(() => {
      return (_req: Request, res: Response) => {
        res.redirect("https://accounts.google.com/o/oauth2/v2/auth");
      };
    });

    const response = await request(app).get("/auth/google");

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );

    expect(authenticateMock).toHaveBeenCalledWith("google", {
      scope: ["email"],
    });
  });
});

describe("Auth Router - GET /auth/google/callback", () => {
  test("responds with status 302 and redirects to frontend if Google authentication fails", async () => {
    authenticateMock.mockImplementation(() => {
      return (_req: Request, res: Response) => {
        res.redirect(`${env.WEBAPP_URL}/login?error=google`);
      };
    });

    const response = await request(app).get("/auth/google/callback");

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toBe(
      `${env.WEBAPP_URL}/login?error=google`,
    );

    expect(authenticateMock).toHaveBeenCalledWith(
      "google",
      expect.any(Function),
    );
  });

  test("responds with status 302 and redirects to frontend if Google authentication is successful when session exists", async () => {
    const fakeGoogleUser = {
      id: "user-1",
      email: "google-user@example.com",
    };

    authenticateMock.mockImplementation(
      (_strategy, optionsOrCallback, maybeCallback) => {
        const callback = (
          typeof optionsOrCallback === "function"
            ? optionsOrCallback
            : maybeCallback
        ) as GoogleAuthCallback;

        return (req: Request) => {
          req.logIn = ((_user, optionsOrDone, maybeDone) => {
            const done =
              typeof optionsOrDone === "function" ? optionsOrDone : maybeDone;
            done(null);
          }) as Request["logIn"];

          req.session.regenerate = ((done) => {
            done(null);
            return req.session;
          }) as Request["session"]["regenerate"];

          req.session.save = ((done) => {
            done?.(null);
            return req.session;
          }) as Request["session"]["save"];

          callback(null, fakeGoogleUser as Express.User);
        };
      },
    );

    const response = await request(app).get("/auth/google/callback");

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toBe(
      `${env.WEBAPP_URL}/?login=google`,
    );

    expect(authenticateMock).toHaveBeenCalledWith(
      "google",
      expect.any(Function),
    );
  });
});
