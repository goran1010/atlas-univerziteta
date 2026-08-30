import { actionSuccessResponseSchema } from "../../../schemas/api";
import { clearCsrfToken } from "../../../utils/getCsrfToken";
import { apiMutation } from "../../../utils/apiMutation";

import type { RequestContext } from "../../../utils/apiMutation";
import type { UserData } from "../../../types/auth";
import type { NavigateFunction } from "react-router";

async function handleLogout(
  navigate: NavigateFunction,
  setUserData: (data: UserData) => void,
  ctx: RequestContext,
) {
  const result = await apiMutation(
    {
      path: "/users/logout",
      method: "POST",
      responseSchema: actionSuccessResponseSchema,
      successMessageKey: "messages.auth.logoutSuccess",
      errorMessageKey: "messages.auth.logoutFailed",
      caughtErrorMessageKey: "messages.auth.logoutError",
      logLabel: "log out",
    },
    ctx,
  );
  if (!result) return;

  setUserData(null);
  clearCsrfToken();
  void navigate("/");
}

export { handleLogout };
