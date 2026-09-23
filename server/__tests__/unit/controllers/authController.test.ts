import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

const { authenticateMock, disconnectMock } = vi.hoisted(() => ({
  authenticateMock: vi.fn(),
  disconnectMock: vi.fn(),
}));

vi.mock("../../../src/config/passport.js", () => ({
  passport: {
    authenticate: authenticateMock,
  },
}));

vi.mock("../../../src/db/prisma.js", () => ({
  prisma: {
    $disconnect: disconnectMock,
    user: {
      create: vi.fn(),
    },
    pendingUser: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import {
  confirmEmail,
  githubCallback,
  login,
} from "../../../src/controllers/authController.js";
import { env } from "../../../src/config/env.js";
import { RequestValidationError } from "../../../src/errors/RequestValidationError.js";

import type { Request, Response } from "express";

type LocalAuthCallback = (
  err: unknown,
  user: Express.User | false | null,
  info?: { message?: string },
) => void;

type GithubAuthCallback = (
  err: unknown,
  user: Express.User | false | null,
  info?: unknown,
) => void;

function createMockResponse() {
  const statusMock = vi.fn().mockReturnThis();
  const jsonMock = vi.fn();
  const sendMock = vi.fn();
  const redirectMock = vi.fn();

  const res = {
    status: statusMock,
    json: jsonMock,
    send: sendMock,
    redirect: redirectMock,
  } as unknown as Response;

  return { res, statusMock, jsonMock, sendMock, redirectMock };
}

describe("authController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("confirmEmail throws a validation error when token is missing", async () => {
    const req = {} as Request;
    const { res } = createMockResponse();

    await expect(confirmEmail(req, res)).rejects.toBeInstanceOf(
      RequestValidationError,
    );
  });

  test("login passes passport authentication errors to next", () => {
    const authError = new Error("auth failed");
    const req = {
      body: {
        email: "user@example.com",
        password: "password123",
      },
      session: {
        regenerate: vi.fn(),
      },
      logIn: vi.fn(),
    } as unknown as Request;
    const { res } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: LocalAuthCallback) => {
        return () => {
          callback?.(authError, null, undefined);
        };
      },
    );

    login(req, res, next);

    expect(next).toHaveBeenCalledWith(authError);
  });

  test("login passes req.logIn errors to next after session regeneration", () => {
    const loginError = new Error("login failed");
    const user = { id: "1", email: "user@example.com" } as Express.User;
    const req = {
      body: {
        email: "user@example.com",
        password: "password123",
      },
      session: {
        regenerate: vi.fn((callback: (err: Error | null) => void) => {
          callback(null);
        }),
      },
      logIn: vi.fn(
        (_user: Express.User, callback: (err: Error | null) => void) => {
          callback(loginError);
        },
      ),
    } as unknown as Request;
    const { res } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: LocalAuthCallback) => {
        return () => {
          callback?.(null, user, undefined);
        };
      },
    );

    login(req, res, next);

    expect(next).toHaveBeenCalledWith(loginError);
  });

  test("login passes session regeneration errors to next", () => {
    const regenerateError = new Error("regenerate failed");
    const user = { id: "1", email: "user@example.com" } as Express.User;
    const req = {
      body: {
        email: "user@example.com",
        password: "password123",
      },
      session: {
        regenerate: vi.fn((callback: (err: Error | null) => void) => {
          callback(regenerateError);
        }),
      },
      logIn: vi.fn(),
    } as unknown as Request;
    const { res } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: LocalAuthCallback) => {
        return () => {
          callback?.(null, user, undefined);
        };
      },
    );

    login(req, res, next);

    expect(next).toHaveBeenCalledWith(regenerateError);
  });

  test("githubCallback passes passport authentication errors to next", () => {
    const authError = new Error("github auth failed");
    const req = {
      session: {
        regenerate: vi.fn(),
        save: vi.fn(),
      },
      logIn: vi.fn(),
    } as unknown as Request;
    const { res } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: GithubAuthCallback) => {
        return () => {
          callback?.(authError, null);
        };
      },
    );

    githubCallback(req, res, next);

    expect(next).toHaveBeenCalledWith(authError);
  });

  test("githubCallback redirects to login when passport returns no user", () => {
    const req = {
      session: {
        regenerate: vi.fn(),
        save: vi.fn(),
      },
      logIn: vi.fn(),
    } as unknown as Request;
    const { res, redirectMock } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: GithubAuthCallback) => {
        return () => {
          callback?.(null, null);
        };
      },
    );

    githubCallback(req, res, next);

    expect(redirectMock).toHaveBeenCalledWith(
      `${env.WEBAPP_URL}/login?error=github`,
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("githubCallback redirects with github_no_email when no verified email is available", () => {
    const req = {
      session: {
        regenerate: vi.fn(),
        save: vi.fn(),
      },
      logIn: vi.fn(),
    } as unknown as Request;
    const { res, redirectMock } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: GithubAuthCallback) => {
        return () => {
          callback?.(null, null, { message: "no_verified_email" });
        };
      },
    );

    githubCallback(req, res, next);

    expect(redirectMock).toHaveBeenCalledWith(
      `${env.WEBAPP_URL}/login?error=github_no_email`,
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("githubCallback passes req.logIn errors to next", () => {
    const loginError = new Error("github login failed");
    const user = { id: "1", email: "user@example.com" } as Express.User;
    const req = {
      session: {
        regenerate: vi.fn((callback: (err: Error | null) => void) => {
          callback(null);
        }),
        save: vi.fn(),
      },
      logIn: vi.fn(
        (_user: Express.User, callback: (err: Error | null) => void) => {
          callback(loginError);
        },
      ),
    } as unknown as Request;
    const { res } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: GithubAuthCallback) => {
        return () => {
          callback?.(null, user);
        };
      },
    );

    githubCallback(req, res, next);

    expect(next).toHaveBeenCalledWith(loginError);
  });

  test("githubCallback passes session save errors to next", () => {
    const saveError = new Error("save failed");
    const user = { id: "1", email: "user@example.com" } as Express.User;
    const req = {
      session: {
        regenerate: vi.fn((callback: (err: Error | null) => void) => {
          callback(null);
        }),
        save: vi.fn((callback: (err: Error | null) => void) => {
          callback(saveError);
        }),
      },
      logIn: vi.fn(
        (_user: Express.User, callback: (err: Error | null) => void) => {
          callback(null);
        },
      ),
    } as unknown as Request;
    const { res } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: GithubAuthCallback) => {
        return () => {
          callback?.(null, user);
        };
      },
    );

    githubCallback(req, res, next);

    expect(next).toHaveBeenCalledWith(saveError);
  });

  test("githubCallback passes session regeneration errors to next", () => {
    const regenerateError = new Error("regenerate failed");
    const user = { id: "1", email: "user@example.com" } as Express.User;
    const req = {
      session: {
        regenerate: vi.fn((callback: (err: Error | null) => void) => {
          callback(regenerateError);
        }),
        save: vi.fn(),
      },
      logIn: vi.fn(),
    } as unknown as Request;
    const { res } = createMockResponse();
    const next = vi.fn();

    authenticateMock.mockImplementation(
      (_strategy: string, callback?: GithubAuthCallback) => {
        return () => {
          callback?.(null, user);
        };
      },
    );

    githubCallback(req, res, next);

    expect(next).toHaveBeenCalledWith(regenerateError);
  });
});
