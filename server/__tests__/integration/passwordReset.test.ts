import request from "supertest";
import { describe, test, expect, vi } from "vitest";

import { app } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { prisma } from "../../src/db/prisma.js";
import { sendResetPasswordEmail } from "../../src/email/resetPasswordEmail.js";
import { createNewUserInput } from "../utils/createNewUserInput.js";
import { getResponseObject } from "../utils/responseHelpers.js";

import type { Agent } from "supertest";

const redirectTo = `${env.WEBAPP_URL}/reset-password`;

async function signUpVerifiedUser(agent: Agent) {
  const userData = createNewUserInput({});

  const signUp = await agent
    .post("/api/auth/sign-up/email")
    .set("Content-Type", "application/json")
    .send({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    });
  expect(signUp.status).toBe(200);

  await prisma.user.update({
    where: { email: userData.email },
    data: { emailVerified: true },
  });

  return userData;
}

function requestReset(agent: Agent, email: string) {
  return agent
    .post("/api/auth/request-password-reset")
    .set("Content-Type", "application/json")
    .send({ email, redirectTo });
}

function signIn(agent: Agent, email: string, password: string) {
  return agent
    .post("/api/auth/sign-in/email")
    .set("Content-Type", "application/json")
    .send({ email, password });
}

// the emailed link is `${baseURL}/reset-password/${token}?callbackURL=...`
function lastEmailedToken(): string {
  const link = vi.mocked(sendResetPasswordEmail).mock.lastCall?.[1];
  const token = new URL(link ?? "").pathname.split("/").pop();
  if (!token)
    throw new Error("No reset link was captured from the email mock.");
  return token;
}

describe("password reset request", () => {
  test("emails a reset link for an existing account", async () => {
    const agent = request.agent(app);
    const userData = await signUpVerifiedUser(agent);
    vi.mocked(sendResetPasswordEmail).mockClear();

    const response = await requestReset(agent, userData.email);

    expect(response.status).toBe(200);
    expect(sendResetPasswordEmail).toHaveBeenCalledTimes(1);
    const [to, link] = vi.mocked(sendResetPasswordEmail).mock.calls[0] ?? [];
    expect(to).toBe(userData.email);
    expect(link).toContain("/api/auth/reset-password/");
    expect(link).toContain(`callbackURL=${encodeURIComponent(redirectTo)}`);
  });

  test("does not reveal whether an account exists", async () => {
    const agent = request.agent(app);
    vi.mocked(sendResetPasswordEmail).mockClear();

    const response = await requestReset(
      agent,
      "nobody_here@non-existent-mail.comms",
    );

    expect(response.status).toBe(200);
    expect(getResponseObject(response.body)["status"]).toBe(true);
    expect(sendResetPasswordEmail).not.toHaveBeenCalled();
  });
});

describe("password reset round trip", () => {
  test("the emailed token sets a new password exactly once", async () => {
    const agent = request.agent(app);
    const userData = await signUpVerifiedUser(agent);
    const newPassword = "NewPassword456";

    await requestReset(agent, userData.email);
    const token = lastEmailedToken();

    const reset = await agent
      .post("/api/auth/reset-password")
      .set("Content-Type", "application/json")
      .send({ newPassword, token });
    expect(reset.status).toBe(200);

    const oldSignIn = await signIn(agent, userData.email, userData.password);
    expect(oldSignIn.status).toBe(401);

    const newSignIn = await signIn(agent, userData.email, newPassword);
    expect(newSignIn.status).toBe(200);

    const reuse = await agent
      .post("/api/auth/reset-password")
      .set("Content-Type", "application/json")
      .send({ newPassword: "AnotherPassword789", token });
    expect(reuse.status).toBe(400);
  });

  test("an invalid token is rejected", async () => {
    const agent = request.agent(app);

    const response = await agent
      .post("/api/auth/reset-password")
      .set("Content-Type", "application/json")
      .send({ newPassword: "NewPassword456", token: "not-a-real-token" });

    expect(response.status).toBe(400);
    expect(getResponseObject(response.body)["code"]).toBe("INVALID_TOKEN");
  });
});
