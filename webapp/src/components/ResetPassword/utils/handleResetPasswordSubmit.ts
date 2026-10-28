import { authClient } from "../../../utils/authClient";

import type { SubmitEvent } from "react";
import type { AddNotification, TFunction } from "../../../types";

interface ResetPasswordContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
}

async function handleResetPasswordSubmit(
  e: SubmitEvent<HTMLFormElement>,
  newPassword: string,
  token: string,
  onDone: () => void,
  onInvalidToken: () => void,
  ctx: ResetPasswordContext,
) {
  e.preventDefault();
  ctx.setLoading(true);

  try {
    const { error } = await authClient.resetPassword({ newPassword, token });

    if (error) {
      if (error.code === "INVALID_TOKEN") {
        onInvalidToken();
        return;
      }
      ctx.addNotification({
        type: "error",
        message: ctx.t("messages.auth.resetFailed"),
      });
      return;
    }

    ctx.addNotification({
      type: "success",
      message: ctx.t("messages.auth.resetSuccess"),
    });
    onDone();
  } catch {
    ctx.addNotification({
      type: "error",
      message: ctx.t("messages.auth.resetError"),
    });
  } finally {
    ctx.setLoading(false);
  }
}

export { handleResetPasswordSubmit };
