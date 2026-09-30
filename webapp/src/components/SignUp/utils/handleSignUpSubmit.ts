import { authClient } from "../../../utils/authClient";

import type { SubmitEvent } from "react";
import type { NavigateFunction } from "react-router";
import type { AddNotification, TFunction } from "../../../types";

interface SignUpContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
}

async function handleSignUpSubmit(
  e: SubmitEvent<HTMLFormElement>,
  inputFields: {
    email: string;
    password: string;
    "confirm-password": string;
  },
  navigate: NavigateFunction,
  ctx: SignUpContext,
) {
  e.preventDefault();
  ctx.setLoading(true);

  try {
    const { error } = await authClient.signUp.email({
      email: inputFields.email,
      password: inputFields.password,
      name: inputFields.email.split("@")[0] ?? inputFields.email,
      // where the email verification link lands, instead of the server root
      callbackURL: `${window.location.origin}/login`,
    });

    if (error) {
      ctx.addNotification({
        type: "error",
        message: ctx.t("messages.auth.registrationFailed"),
      });
      return;
    }

    ctx.addNotification({
      type: "success",
      message: ctx.t("messages.auth.registrationSuccess"),
    });
    void navigate("/login");
  } catch {
    ctx.addNotification({
      type: "error",
      message: ctx.t("messages.auth.registrationError"),
    });
  } finally {
    ctx.setLoading(false);
  }
}

export { handleSignUpSubmit };
