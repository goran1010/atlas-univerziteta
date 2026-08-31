import { describe, test, expect, vi, beforeEach } from "vitest";
import request from "supertest";

import type { Request, Response, NextFunction } from "express";

vi.mock("../../src/config/sessionMiddleware.js", () => ({
  sessionMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    const session = {
      cookie: {
        originalMaxAge: 1000 * 60 * 60 * 24,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        secure: false,
        httpOnly: true,
      },
      id: "test-session-id",
      destroy: vi.fn((callback?: (err?: unknown) => void) => {
        callback?.();
        return session;
      }),
      regenerate: vi.fn((callback?: (err?: unknown) => void) => {
        callback?.();
        return session;
      }),
      save: vi.fn((callback?: (err?: unknown) => void) => {
        callback?.();
        return session;
      }),
      reload: vi.fn((callback?: (err?: unknown) => void) => {
        callback?.();
        return session;
      }),
      resetMaxAge: vi.fn(),
      touch: vi.fn(),
    } as Request["session"];

    req.session = session;
    next();
  },
}));

import { app } from "../../../src/app.js";
import { emailConfirmHTML } from "../../../src/utils/emailConfirmHTML.js";
import { createNewUserInput } from "../../utils/createNewUserInput.js";
import { prisma } from "../../../src/db/prisma.js";
import { sendConfirmationEmail } from "../../../src/email/confirmationEmail.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

type AuthGuardHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

const isAuthenticatedMock = vi.fn<AuthGuardHandler>();

vi.mock("../../src/auth/isAuthenticated.js", () => ({
  isAuthenticated: (req: Request, res: Response, next: NextFunction): void => {
    isAuthenticatedMock(req, res, next);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  isAuthenticatedMock.mockImplementation((req, res, next) => {
    if (req.user) {
      next();
      return;
    }

    res.status(403).json({ error: "You need to be logged in." });
  });
});

function expectValidationIssue(
  error: Record<string, unknown>,
  message: string,
) {
  expect(error["code"]).toBe("VALIDATION_ERROR");
  expect(error["message"]).toBe("Request validation failed.");
  expect(error["issues"]).toEqual(
    expect.arrayContaining([expect.objectContaining({ message })]),
  );
}

describe("POST /auth/signup", () => {
  test("responds with status 400 and message for too few characters in password input", async () => {
    const newUser = createNewUserInput({
      password: "123",
      "confirm-password": "123",
    });

    const responseData = {
      error: {
        message:
          "Password must be at least 6 characters long and contain at least one number",
      },
    };

    const response = await request(app).post("/auth/signup").send(newUser);
    const responseBody = getResponseObject(response.body as unknown);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, responseData.error.message);
  });

  test("responds with status 400 and message for invalid characters in password input", async () => {
    const newUser = createNewUserInput({
      password: "invalid@password",
      "confirm-password": "invalid@password",
    });

    const responseData = {
      error: {
        message:
          "Password can only contain letters, numbers, dashes or underscores",
      },
    };

    const response = await request(app).post("/auth/signup").send(newUser);
    const responseBody = getResponseObject(response.body as unknown);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, responseData.error.message);
  });

  test("responds with status 400 and message for incorrect confirm-password input", async () => {
    const newUser = createNewUserInput({
      "confirm-password": "123",
    });

    const responseData = {
      error: {
        message: "Passwords do not match",
      },
    };

    const response = await request(app).post("/auth/signup").send(newUser);
    const responseBody = getResponseObject(response.body as unknown);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, responseData.error.message);
  });

  test("successfully create a user and returns status 201 and message", async () => {
    const newUser = createNewUserInput();

    vi.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null);
    vi.spyOn(prisma.pendingUser, "findMany").mockResolvedValueOnce([]);
    vi.spyOn(prisma.pendingUser, "create").mockResolvedValueOnce({
      id: "mock-pending-user-id",
      email: newUser.email,
      password: "hashed-password",
      token: "mock-token",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    vi.spyOn(prisma.user, "create").mockResolvedValueOnce({
      ...newUser,
      adminRequestedAt: null,
    });

    const response = await request(app).post("/auth/signup").send(newUser);
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(sendConfirmationEmail).toHaveBeenCalled();
    expect(response.status).toBe(201);
    expect(responseBody["message"]).toBe(
      "Registration successful! Check your email.",
    );
    expect(data["email"]).toBe(newUser.email);
  });

  test("responds with generic 400 error if given email exists", async () => {
    const newUser = createNewUserInput();
    vi.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
      id: "existing-user-id",
      email: newUser.email,
      password: "hashed-password",
      role: "USER",
      githubId: null,
      adminRequestedAt: null,
    });

    const responseData = {
      error: {
        message: "Signup failed: check your input and try again.",
      },
    };

    const response = await request(app).post("/auth/signup").send(newUser);
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["message"]).toBeTypeOf("string");
    expect(error["message"]).toContain(responseData.error.message);
  });
});

describe("GET /auth/confirm/:token", () => {
  test("responds with status 404 and message for no token provided", async () => {
    const response = await request(app).get("/auth/confirm/");
    const expectedResponse = {
      status: 404,
      body: {
        error: {
          message: "Route not found: check the URL and HTTP method.",
        },
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });

  test("responds with status 400 and message for invalid token", async () => {
    vi.spyOn(console, "error").mockImplementation(() => vi.fn());
    vi.spyOn(prisma.pendingUser, "findMany").mockResolvedValueOnce([]);

    const response = await request(app).get("/auth/confirm/12345");
    const expectedResponse = {
      status: 400,
      body: {
        error: {
          message:
            "Email confirmation failed: token is invalid or expired. Request a new confirmation email.",
        },
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });

  test("responds with status 200 and HTML for valid token", async () => {
    vi.spyOn(prisma.pendingUser, "findMany").mockResolvedValueOnce([
      {
        id: "mock-pending-user-id",
        email: "test_user@example.com",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        password: "hashed-password",
        token: "mock-token",
      },
    ]);

    vi.spyOn(prisma.pendingUser, "delete").mockResolvedValueOnce({
      id: "mock-pending-user-id",
      email: "test_user@example.com",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      password: "hashed-password",
      token: "mock-token",
    });
    vi.spyOn(prisma.user, "create").mockResolvedValueOnce({
      id: "mock-user-id",
      email: "test_user@example.com",
      password: "hashed-password",
      role: "USER",
      githubId: null,
      adminRequestedAt: null,
    });

    const token = crypto.randomBytes(32).toString("hex");

    vi.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
      id: "existing-user-id",
      email: "test_user@example.com",
      password: "hashed-password",
      role: "USER",
      githubId: null,
      adminRequestedAt: null,
    });
    vi.spyOn(prisma.user, "update").mockResolvedValueOnce({
      id: "existing-user-id",
      email: "test_user@example.com",
      password: "hashed-password",
      role: "USER",
      githubId: null,
      adminRequestedAt: null,
    });

    const response = await request(app).get(`/auth/confirm/${token}`);
    const expectedResponse = {
      status: 200,
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
    expect(response.text).toContain(emailConfirmHTML());
  });
});

describe("POST /auth/login", () => {
  test("responds with Incorrect email for wrong input", async () => {
    const newUser = createNewUserInput();
    vi.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null);

    const responseData = {
      error: {
        message: "Incorrect email or password",
      },
    };

    const response = await request(app).post("/auth/login").send(newUser);
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(401);
    expect(error["message"]).toBeTypeOf("string");
    expect(error["message"]).toContain(responseData.error.message);
  });

  test("responds with User test_user logged in successfully for correct input", async () => {
    const newUser = createNewUserInput();
    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
      ...newUser,
      password: hashedPassword,
      adminRequestedAt: null,
    });

    const response = await request(app).post("/auth/login").send(newUser);
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("Logged in successfully");
  });
});
