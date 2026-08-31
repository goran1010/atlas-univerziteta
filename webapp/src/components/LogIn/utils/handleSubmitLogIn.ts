import { loginResponseSchema } from "../../../schemas/auth";
import { apiMutation } from "../../../utils/apiMutation";
import { clearCsrfToken } from "../../../utils/getCsrfToken";

import type { SubmitEvent } from "react";
import type { NavigateFunction } from "react-router";
import type { RequestContext } from "../../../utils/apiMutation";
import type { UserData } from "../../../types/auth";

async function handleSubmitLogIn(
  e: SubmitEvent<HTMLFormElement>,
  inputFields: { email: string; password: string },
  setUserData: (data: UserData) => void,
  navigate: NavigateFunction,
  ctx: RequestContext,
) {
  e.preventDefault();

  const result = await apiMutation(
    {
      path: "/auth/login",
      method: "POST",
      body: {
        email: inputFields.email,
        password: inputFields.password,
      },
      responseSchema: loginResponseSchema,
      successMessageKey: "messages.auth.loginSuccess",
      errorMessageKey: "messages.auth.loginFailed",
      caughtErrorMessageKey: "messages.auth.loginError",
      logLabel: "log in",
    },
    ctx,
  );
  if (!result) return;

  setUserData(result.data);
  clearCsrfToken();
  void navigate("/");
}

export { handleSubmitLogIn };
