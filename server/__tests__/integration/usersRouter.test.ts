import request from "supertest";
import { describe, test, expect } from "vitest";
import { app } from "../../src/app.js";
import { createAndLoginUser } from "../utils/createUserAndLogin.js";
import { createNewUserInput } from "../utils/createNewUserInput.js";
import { prisma } from "../../src/db/prisma.js";

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

describe("usersRouter", () => {
  test("successfully create a user and returns status 201 and message", async () => {
    const newUserData = createNewUserInput();

    const response = await request(app).post("/auth/signup").send(newUserData);
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(201);
    expect(responseBody["message"]).toBe(
      "Registration successful! Check your email.",
    );
    expect(responseBody["data"]).toBeTypeOf("object");
  });

  test("responds with 200 and User test_user logged in successfully for correct login input", async () => {
    const agent = request.agent(app);
    const newUserData = createNewUserInput();

    const response = await createAndLoginUser(agent, newUserData);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Logged in successfully",
      }),
    );
  });

  test("responds User logged out successfully", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent.post("/users/logout");
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "User logged out successfully",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});

describe("usersRouter - POST /users/request-admin", () => {
  test("responds with 200 and stores the request timestamp for a USER", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent.post("/users/request-admin");
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Admin access requested. An admin will review it.",
    );
    expect(data["adminRequestedAt"]).toBeTypeOf("string");

    const userInDb = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    expect(userInDb?.adminRequestedAt).toBeInstanceOf(Date);

    // Repeating the request refreshes the timestamp instead of failing
    const repeatResponse = await agent.post("/users/request-admin");
    expect(repeatResponse.status).toBe(200);

    await prisma.user.delete({ where: { email: userData.email } });
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

    await prisma.user.delete({ where: { email: userData.email } });
  });

  test("responds with 401 when not logged in", async () => {
    const response = await request(app).post("/users/request-admin");

    expect(response.status).toBe(401);
  });

  test("exposes adminRequestedAt through GET /users/me", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);
    await agent.post("/users/request-admin");

    const response = await agent.get("/users/me");
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(data["adminRequestedAt"]).toBeTypeOf("string");

    await prisma.user.delete({ where: { email: userData.email } });
  });
});

describe("usersRouter - DELETE /users/request-admin", () => {
  test("responds with 200 and clears the request timestamp", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);
    await agent.post("/users/request-admin");

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

    await prisma.user.delete({ where: { email: userData.email } });
  });
});
