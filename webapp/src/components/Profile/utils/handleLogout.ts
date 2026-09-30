import { authClient } from "../../../utils/authClient";

import type { AddNotification, TFunction } from "../../../types";
import type { UserData } from "../../../types";
import type { NavigateFunction } from "react-router";

interface LogoutContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
}

async function handleLogout(
  navigate: NavigateFunction,
  setUserData: (data: UserData) => void,
  ctx: LogoutContext,
) {
  ctx.setLoading(true);

  try {
    const { error } = await authClient.signOut();

    if (error) {
      ctx.addNotification({
        type: "error",
        message: ctx.t("messages.auth.logoutFailed"),
      });
      return;
    }

    setUserData(null);
    ctx.addNotification({
      type: "success",
      message: ctx.t("messages.auth.logoutSuccess"),
    });
    void navigate("/");
  } catch {
    ctx.addNotification({
      type: "error",
      message: ctx.t("messages.auth.logoutError"),
    });
  } finally {
    ctx.setLoading(false);
  }
}

export { handleLogout };
