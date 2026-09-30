import { authClient } from "../../../utils/authClient";

import type { SubmitEvent } from "react";
import type { NavigateFunction } from "react-router";
import type { UserData } from "../../../types";
import type { AddNotification, TFunction } from "../../../types";

interface LoginContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
}

async function handleSubmitLogIn(
  e: SubmitEvent<HTMLFormElement>,
  inputFields: { email: string; password: string },
  setUserData: (data: UserData) => void,
  navigate: NavigateFunction,
  ctx: LoginContext,
) {
  e.preventDefault();
  ctx.setLoading(true);

  try {
    const { data, error } = await authClient.signIn.email({
      email: inputFields.email,
      password: inputFields.password,
    });

    if (error) {
      ctx.addNotification({
        type: "error",
        message: ctx.t("messages.auth.loginFailed"),
      });
      return;
    }

    setUserData(data.user);
    ctx.addNotification({
      type: "success",
      message: ctx.t("messages.auth.loginSuccess"),
    });
    void navigate("/");
  } catch {
    ctx.addNotification({
      type: "error",
      message: ctx.t("messages.auth.loginError"),
    });
  } finally {
    ctx.setLoading(false);
  }
}

export { handleSubmitLogIn };
