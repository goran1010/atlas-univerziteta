import { createNewUserInput } from "./createNewUserInput.js";
import { prisma } from "../../src/db/prisma.js";

interface CreateNewUserInputOptions {
  id?: string;
  email?: string;
  password?: string;
  role?: "USER" | "ADMIN";
  githubId?: string | null;
  googleId?: string | null;
  "confirm-password"?: string;
}

import type { Agent } from "supertest";

async function createAndLoginUser(
  agent: Agent,
  newUser: CreateNewUserInputOptions,
) {
  const userData = createNewUserInput(newUser);

  await agent.post("/auth/signup").send(userData);

  const users = await prisma.pendingUser.findMany({
    where: { email: userData.email },
  });
  if (!users[0]) {
    throw new Error("Pending user not found after signup.");
  }
  const token = users[0].token;

  await agent.get(`/auth/confirm/${token}`);

  if (userData.role !== "USER") {
    await prisma.user.update({
      where: { email: userData.email },
      data: { role: userData.role },
    });
  }

  const response = await agent.post("/auth/login").send({
    email: userData.email,
    password: userData.password,
  });

  return response;
}

export { createAndLoginUser };
