import { signupResponseSchema } from "../../../schemas/auth";
import { apiMutation } from "../../../utils/apiMutation";

import type { SubmitEvent } from "react";
import type { NavigateFunction } from "react-router";
import type { RequestContext } from "../../../utils/apiMutation";

async function handleSignUpSubmit(
  e: SubmitEvent<HTMLFormElement>,
  inputFields: {
    email: string;
    password: string;
    "confirm-password": string;
  },
  navigate: NavigateFunction,
  ctx: RequestContext,
) {
  e.preventDefault();

  const result = await apiMutation(
    {
      path: "/auth/signup",
      method: "POST",
      body: {
        email: inputFields.email,
        password: inputFields.password,
        "confirm-password": inputFields["confirm-password"],
      },
      responseSchema: signupResponseSchema,
      successMessageKey: "messages.auth.registrationSuccess",
      errorMessageKey: "messages.auth.registrationFailed",
      caughtErrorMessageKey: "messages.auth.registrationError",
      logLabel: "sign up",
    },
    ctx,
  );
  if (!result) return;

  void navigate("/login");
}

export { handleSignUpSubmit };
