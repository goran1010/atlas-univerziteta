import request from "supertest";
import { describe, test, expect } from "vitest";
import { app } from "../../src/app.js";
import { createAndLoginUser } from "../utils/createUserAndLogin.js";
import { createNewUserInput } from "../utils/createNewUserInput.js";
import { prisma } from "../../src/db/prisma.js";

async function deleteUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.pendingChange.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

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

  test("logout responds with success", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent.post("/users/logout");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "User logged out successfully",
      }),
    );

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

    await deleteUser(userData.email);
  });
});
