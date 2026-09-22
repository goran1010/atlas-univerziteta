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

type GitHubAuthCallback = (
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

describe("Auth Router - GET /auth/github", () => {
  test("responds with status 302 and redirects to GitHub for authentication", async () => {
    authenticateMock.mockImplementation(() => {
      return (_req: Request, res: Response) => {
        res.redirect("https://github.com/login/oauth/authorize");
      };
    });

    const response = await request(app).get("/auth/github");

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toBe(
      "https://github.com/login/oauth/authorize",
    );

    expect(authenticateMock).toHaveBeenCalledWith("github", {
      scope: ["user:email"],
    });
  });
});

describe("Auth Router - GET /auth/github/callback", () => {
  test("responds with status 302 and redirects to frontend if GitHub authentication fails", async () => {
    authenticateMock.mockImplementation(() => {
      return (_req: Request, res: Response) => {
        res.redirect(`${env.WEBAPP_URL}/login?error=github`);
      };
    });

    const response = await request(app).get("/auth/github/callback");

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toBe(
      `${env.WEBAPP_URL}/login?error=github`,
    );

    expect(authenticateMock).toHaveBeenCalledWith(
      "github",
      expect.any(Function),
    );
  });

  test("responds with status 302 and redirects to frontend if GitHub authentication is successful when session exists", async () => {
    const fakeGithubUser = {
      id: "user-1",
      email: "github-user@example.com",
    };

    authenticateMock.mockImplementation(
      (_strategy, optionsOrCallback, maybeCallback) => {
        const callback = (
          typeof optionsOrCallback === "function"
            ? optionsOrCallback
            : maybeCallback
        ) as GitHubAuthCallback;

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

          callback(null, fakeGithubUser as Express.User);
        };
      },
    );

    const response = await request(app).get("/auth/github/callback");

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toBe(
      `${env.WEBAPP_URL}/?login=github`,
    );

    expect(authenticateMock).toHaveBeenCalledWith(
      "github",
      expect.any(Function),
    );
  });
});
