import request from "supertest";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { app } from "../../src/app.js";
import { logger } from "../../src/utils/logger.js";
import { createNewUserInput } from "../utils/createNewUserInput.js";
import { emailConfirmHTML } from "../../src/utils/emailConfirmHTML.js";
import { prisma } from "../../src/db/prisma.js";
import bcrypt from "bcryptjs";
import { sendConfirmationEmail } from "../../src/email/confirmationEmail.js";

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function signUpAndGetPendingToken(email?: string, password = "123123") {
  const userInput: NonNullable<Parameters<typeof createNewUserInput>[0]> = {
    password,
    "confirm-password": password,
  };

  if (email) {
    userInput.email = email;
  }

  const newUser = createNewUserInput(userInput);

  const signupResponse = await request(app).post("/auth/signup").send(newUser);
  expect(signupResponse.status).toBe(201);

  const users = await prisma.pendingUser.findMany({
    where: { email: newUser.email },
  });
  const pendingUser = users[0];

  if (!pendingUser) {
    throw new Error("No pending user found for the provided email.");
  }

  return { newUser, token: pendingUser.token, pendingUser };
}

describe("Auth Router - POST /auth/signup", () => {
  test("responds with status 201 and Registration successful! Check your email message if user created successfully", async () => {
    const newUser = createNewUserInput();
    const response = await request(app).post("/auth/signup").send(newUser);
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(201);
    expect(responseBody["message"]).toBe(
      "Registration successful! Check your email.",
    );
    expect(responseBody["data"]).toBeTypeOf("object");
  });

  test("updates an existing pending signup instead of creating a second pending user", async () => {
    const firstSignup = createNewUserInput();
    const secondSignup = createNewUserInput({
      email: firstSignup.email,
      password: "456456",
      "confirm-password": "456456",
    });

    const firstResponse = await request(app)
      .post("/auth/signup")
      .send(firstSignup);

    expect(firstResponse.status).toBe(201);

    const firstPendingUsers = await prisma.pendingUser.findMany({
      where: { email: firstSignup.email },
    });
    const firstPendingUser = firstPendingUsers[0];

    expect(firstPendingUsers).toHaveLength(1);

    if (!firstPendingUser) {
      throw new Error("Expected pending user after first signup.");
    }

    const secondResponse = await request(app)
      .post("/auth/signup")
      .send(secondSignup);

    expect(secondResponse.status).toBe(201);

    const updatedPendingUsers = await prisma.pendingUser.findMany({
      where: { email: firstSignup.email },
    });
    const updatedPendingUser = updatedPendingUsers[0];

    expect(updatedPendingUsers).toHaveLength(1);

    if (!updatedPendingUser) {
      throw new Error("Expected updated pending user after second signup.");
    }

    expect(updatedPendingUser.id).toBe(firstPendingUser.id);
    expect(updatedPendingUser.token).not.toBe(firstPendingUser.token);
    await expect(
      bcrypt.compare(secondSignup.password, updatedPendingUser.password),
    ).resolves.toBe(true);
    await expect(
      bcrypt.compare(firstSignup.password, updatedPendingUser.password),
    ).resolves.toBe(false);
  });

  test("responds with status 400 when the email already has a password account", async () => {
    const existing = createNewUserInput();
    await prisma.user.create({
      data: {
        email: existing.email,
        password: await bcrypt.hash(existing.password, 10),
      },
    });

    const response = await request(app)
      .post("/auth/signup")
      .send(createNewUserInput({ email: existing.email }));
    const responseBody = getResponseObject(response.body);

    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["message"]).toBe(
      "Signup failed: check your input and try again.",
    );
  });

  test("allows signup for a GitHub-only account and attaches the password on confirmation", async () => {
    const githubOnly = createNewUserInput();
    const createdUser = await prisma.user.create({
      data: {
        email: githubOnly.email,
        githubId: `github_${githubOnly.id}`,
      },
    });

    const { newUser, token } = await signUpAndGetPendingToken(githubOnly.email);

    const confirmResponse = await request(app).get(`/auth/confirm/${token}`);
    expect(confirmResponse.status).toBe(200);

    const users = await prisma.user.findMany({
      where: { email: githubOnly.email },
    });
    expect(users).toHaveLength(1);
    const user = users[0];
    if (!user?.password) {
      throw new Error("Expected the confirmed user to have a password.");
    }
    expect(user.id).toBe(createdUser.id);
    expect(user.githubId).toBe(createdUser.githubId);
    await expect(bcrypt.compare(newUser.password, user.password)).resolves.toBe(
      true,
    );

    const loginResponse = await request
      .agent(app)
      .post("/auth/login")
      .send({ email: newUser.email, password: newUser.password });
    expect(loginResponse.status).toBe(200);
  });

  test("responds with status 500 and removes pending signup when confirmation email sending fails", async () => {
    const newUser = createNewUserInput();
    vi.mocked(sendConfirmationEmail).mockResolvedValueOnce({
      success: false,
      error: "mock email failure",
    });

    const response = await request(app).post("/auth/signup").send(newUser);
    const pendingUsers = await prisma.pendingUser.findMany({
      where: { email: newUser.email },
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "EMAIL_NOT_SENT",
        message:
          "Signup failed: confirmation email was not sent. Check your email address and try again.",
      },
    });
    expect(pendingUsers).toHaveLength(0);
  });

  test("responds with status 500 when signup processing throws unexpectedly", async () => {
    const newUser = createNewUserInput();
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    vi.spyOn(bcrypt, "hash").mockRejectedValueOnce(new Error("hash failed"));

    const response = await request(app).post("/auth/signup").send(newUser);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Server error: please try again later.",
      },
    });
  });
});

describe("Auth Router - GET /auth/confirm/:token", () => {
  test("responds with status 400 and message for invalid token", async () => {
    const response = await request(app).get(
      "/auth/confirm/does-not-exist-token-value",
    );

    expect(response.status).toBe(400);
    // confirmation links open in a browser, so errors are HTML pages
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain(
      "The confirmation link is invalid or expired.",
    );
  });

  test("responds with status 200 and Email confirmed successfully message if token is valid", async () => {
    const agent = request.agent(app);
    const { token } = await signUpAndGetPendingToken();

    const response = await agent.get(`/auth/confirm/${token}`);
    const expectedResponse = {
      status: 200,
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
    expect(response.text).toContain(emailConfirmHTML());
  });

  test("responds with status 400 and deletes expired pending users", async () => {
    const expiredPendingUser = await prisma.pendingUser.create({
      data: {
        email: createNewUserInput().email,
        password: "hashed-password",
        token: "expired-token",
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const response = await request(app).get(
      `/auth/confirm/${expiredPendingUser.token}`,
    );
    const pendingUserInDb = await prisma.pendingUser.findUnique({
      where: { id: expiredPendingUser.id },
    });

    expect(response.status).toBe(400);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("The link expired. Please sign up again.");
    expect(pendingUserInDb).toBeNull();
  });

  test("attaches the password when a GitHub account claimed the email after signup", async () => {
    const { newUser, token } = await signUpAndGetPendingToken();

    const githubUser = await prisma.user.create({
      data: {
        email: newUser.email,
        githubId: `github_${newUser.id}`,
      },
    });

    const confirmResponse = await request(app).get(`/auth/confirm/${token}`);
    expect(confirmResponse.status).toBe(200);

    const users = await prisma.user.findMany({
      where: { email: newUser.email },
    });
    expect(users).toHaveLength(1);
    const user = users[0];
    if (!user?.password) {
      throw new Error("Expected the confirmed user to have a password.");
    }
    expect(user.id).toBe(githubUser.id);
    await expect(bcrypt.compare(newUser.password, user.password)).resolves.toBe(
      true,
    );
  });

  test("responds with status 400 and consumes the token when the email gained a password account after signup", async () => {
    const { newUser, token } = await signUpAndGetPendingToken();

    const otherPassword = await bcrypt.hash("other_password_456", 10);
    await prisma.user.create({
      data: {
        email: newUser.email,
        password: otherPassword,
      },
    });

    const confirmResponse = await request(app).get(`/auth/confirm/${token}`);

    expect(confirmResponse.status).toBe(400);
    expect(confirmResponse.headers["content-type"]).toContain("text/html");
    expect(confirmResponse.text).toContain(
      "This email is already registered. Log in instead.",
    );

    const pendingUsers = await prisma.pendingUser.findMany({
      where: { email: newUser.email },
    });
    expect(pendingUsers).toHaveLength(0);

    const user = await prisma.user.findUnique({
      where: { email: newUser.email },
    });
    expect(user?.password).toBe(otherPassword);
  });

  test("responds with status 500 when confirmation processing fails unexpectedly", async () => {
    const { token } = await signUpAndGetPendingToken();
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    vi.spyOn(prisma.user, "create").mockRejectedValueOnce(
      new Error("create failed"),
    );

    const response = await request(app).get(`/auth/confirm/${token}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Server error: please try again later.",
      },
    });
  });
});

describe("Auth Router - GET /auth/github OAuth state", () => {
  test("the GitHub authorization redirect carries a state nonce", async () => {
    const response = await request(app).get("/auth/github");

    expect(response.status).toBe(302);
    const location = response.headers["location"] ?? "";
    expect(location).toContain("github.com/login/oauth/authorize");
    expect(location).toMatch(/[?&]state=[^&]+/);
  });

  test("a callback with a mismatched state fails without reaching GitHub", async () => {
    const agent = request.agent(app);
    await agent.get("/auth/github");

    const response = await agent.get(
      "/auth/github/callback?code=fake-code&state=wrong-state",
    );

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toContain("/login?error=github");
  });

  test("a callback without a session fails without reaching GitHub", async () => {
    const response = await request(app).get(
      "/auth/github/callback?code=fake-code&state=any-state",
    );

    expect(response.status).toBe(302);
    expect(response.headers["location"]).toContain("/login?error=github");
  });
});

describe("Auth Router - POST /auth/login", () => {
  test("responds with status 200 and access token if login is successful", async () => {
    const agent = request.agent(app);
    const { newUser, token } = await signUpAndGetPendingToken();

    await agent.get(`/auth/confirm/${token}`);

    const response = await agent.post("/auth/login").send({
      email: newUser.email,
      password: newUser.password,
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Logged in successfully",
      }),
    );
  });

  test("responds with status 401 when password is incorrect", async () => {
    const agent = request.agent(app);
    const { newUser, token } = await signUpAndGetPendingToken();

    await agent.get(`/auth/confirm/${token}`);

    const response = await agent.post("/auth/login").send({
      email: newUser.email,
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "LOGIN_FAILED",
        message:
          "Login failed: Incorrect email or password. Check your credentials and try again.",
      },
    });
  });

  test("responds with status 500 when the local strategy throws during login", async () => {
    const agent = request.agent(app);
    const { newUser, token } = await signUpAndGetPendingToken();

    await agent.get(`/auth/confirm/${token}`);
    vi.spyOn(bcrypt, "compare").mockRejectedValueOnce(
      new Error("compare failed"),
    );

    const response = await agent.post("/auth/login").send({
      email: newUser.email,
      password: newUser.password,
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Server error: please try again later.",
      },
    });
  });
});
