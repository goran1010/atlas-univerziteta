import request from "supertest";
import { describe, test, expect, vi } from "vitest";

import { app } from "../../src/app.js";
import { sendConfirmationEmail } from "../../src/email/confirmationEmail.js";
import { createNewUserInput } from "../utils/createNewUserInput.js";
import { getResponseObject } from "../utils/responseHelpers.js";

describe("sign-in with an unverified email", () => {
  test("is rejected and re-sends the verification email", async () => {
    const agent = request.agent(app);
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

    vi.mocked(sendConfirmationEmail).mockClear();

    const signIn = await agent
      .post("/api/auth/sign-in/email")
      .set("Content-Type", "application/json")
      .send({ email: userData.email, password: userData.password });

    expect(signIn.status).toBe(403);
    const body = getResponseObject(signIn.body);
    expect(body["code"]).toBe("EMAIL_NOT_VERIFIED");

    // requireEmailVerification re-sends the link on a blocked sign-in
    expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendConfirmationEmail).mock.calls[0]?.[0]).toBe(
      userData.email,
    );
  });
});
