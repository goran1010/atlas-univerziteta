import { createNewUserInput } from "./createNewUserInput.js";
import { prisma } from "../../src/db/prisma.js";

import type { Agent } from "supertest";

interface CreateNewUserInputOptions {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: "USER" | "ADMIN";
}

async function createAndLoginUser(
  agent: Agent,
  newUser: CreateNewUserInputOptions,
) {
  const userData = createNewUserInput(newUser);

  await agent
    .post("/api/auth/sign-up/email")
    .set("Content-Type", "application/json")
    .send({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    });

  if (userData.role !== "USER") {
    await prisma.user.update({
      where: { email: userData.email },
      data: { role: userData.role },
    });
  }

  const response = await agent
    .post("/api/auth/sign-in/email")
    .set("Content-Type", "application/json")
    .send({
      email: userData.email,
      password: userData.password,
    });

  return response;
}

export { createAndLoginUser };
