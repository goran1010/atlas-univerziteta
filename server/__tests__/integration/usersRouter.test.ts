import request from "supertest";
import { describe, test, expect } from "vitest";
import { app } from "../../src/app.js";
import { createAndLoginUser } from "../utils/createUserAndLogin.js";
import { createNewUserInput } from "../utils/createNewUserInput.js";
import { deleteUser } from "../utils/deleteUser.js";
import { prisma } from "../../src/db/prisma.js";
import { env } from "../../src/config/env.js";

describe("usersRouter", () => {
  test("sign up creates a user via BetterAuth", async () => {
    const userData = createNewUserInput();

    const response = await request(app)
      .post("/api/auth/sign-up/email")
      .set("Content-Type", "application/json")
      .send({
        email: userData.email,
        password: userData.password,
        name: userData.name,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");

    await deleteUser(userData.email);
  });

  test("sign in returns a session", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    const response = await createAndLoginUser(agent, userData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");

    await deleteUser(userData.email);
  });
});

describe("usersRouter - POST /users/request-admin", () => {
  test("responds with 200 and stores the request timestamp for a USER", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent.post("/users/request-admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Admin access requested. An admin will review it.",
      }),
    );

    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(userInDb?.adminRequestedAt).toBeInstanceOf(Date);

    await deleteUser(userData.email);
  });

  test("stores an optional reason with the request", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent
      .post("/users/request-admin")
      .send({ reason: "I maintain the data for my university" });

    expect(response.status).toBe(200);
    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(userInDb?.adminRequestReason).toBe(
      "I maintain the data for my university",
    );

    await deleteUser(userData.email);
  });

  test("responds with 400 when the reason exceeds its max length", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent
      .post("/users/request-admin")
      .send({ reason: "a".repeat(1001) });

    expect(response.status).toBe(400);

    await deleteUser(userData.email);
  });

  test("responds with 400 for an ADMIN user", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput({ role: "ADMIN" });
    await createAndLoginUser(agent, userData);

    const response = await agent.post("/users/request-admin");

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          code: "ALREADY_ADMIN",
          message: "You already have the admin role.",
        },
      }),
    );

    await deleteUser(userData.email);
  });

  test("responds with 401 when not logged in", async () => {
    const response = await request(app).post("/users/request-admin");

    expect(response.status).toBe(401);
  });
});

describe("usersRouter - DELETE /users/request-admin", () => {
  test("responds with 200 and clears the request timestamp", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);
    await agent
      .post("/users/request-admin")
      .send({ reason: "Cancelled later" });

    const response = await agent.delete("/users/request-admin");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Admin request cancelled.",
      }),
    );

    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(userInDb?.adminRequestedAt).toBeNull();
    expect(userInDb?.adminRequestReason).toBeNull();

    await deleteUser(userData.email);
  });
});

describe("usersRouter - origin verification", () => {
  test("responds with 403 for a state-changing request from a foreign origin", async () => {
    const response = await request(app)
      .post("/users/request-admin")
      .set("Origin", "https://evil.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: "FORBIDDEN",
        message: "Request origin is not allowed.",
      },
    });
  });

  test("accepts a state-changing request from the webapp origin", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent
      .post("/users/request-admin")
      .set("Origin", env.WEBAPP_URL);

    expect(response.status).toBe(200);

    await deleteUser(userData.email);
  });
});
