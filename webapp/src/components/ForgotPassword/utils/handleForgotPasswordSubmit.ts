import { authClient } from "../../../utils/authClient";

import type { SubmitEvent } from "react";
import type { AddNotification, TFunction } from "../../../types";

interface ForgotPasswordContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
}

async function handleForgotPasswordSubmit(
  e: SubmitEvent<HTMLFormElement>,
  email: string,
  onSent: () => void,
  ctx: ForgotPasswordContext,
) {
  e.preventDefault();
  ctx.setLoading(true);

  try {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      ctx.addNotification({
        type: "error",
        message: ctx.t("messages.auth.resetRequestFailed"),
      });
      return;
    }

    onSent();
  } catch {
    ctx.addNotification({
      type: "error",
      message: ctx.t("messages.auth.resetRequestError"),
    });
  } finally {
    ctx.setLoading(false);
  }
}

export { handleForgotPasswordSubmit };
