import { SERVER_URL } from "../../../utils/envConfig";
import { readErrorMessage } from "../../../schemas/api";
import { loginResponseSchema } from "../../../schemas/auth";
import { getCsrfToken, clearCsrfToken } from "../../../utils/getCsrfToken";
import { guardedFetch } from "../../../utils/guardedFetch";
import { isServerNotReadyError } from "../../../utils/serverStatus";
import type { SubmitEvent } from "react";
import type { NavigateFunction } from "react-router";
import type { AddNotification } from "../../../types/notification";
import type { TFunction } from "../../../types/i18n";
import type { ServerStatus } from "../../../utils/serverStatus";
import type { UserData } from "../../../types/auth";

type HandleLogInSubmit = (
  e: SubmitEvent<HTMLFormElement>,
  inputFields: {
    email: string;
    password: string;
  },
  setUserData: (data: UserData) => void,
  addNotification: AddNotification,
  setLoading: (loading: boolean) => void,
  navigate: NavigateFunction,
  t: TFunction,
  serverStatus: ServerStatus,
) => Promise<void>;

async function getErrorMessage(response: Response) {
  try {
    return readErrorMessage(await response.json());
  } catch {
    return null;
  }
}

const handleSubmitLogIn: HandleLogInSubmit = async function (
  e,
  inputFields,
  setUserData,
  addNotification,
  setLoading,
  navigate,
  t,
  serverStatus,
) {
  try {
    e.preventDefault();

    setLoading(true);

    const csrfToken = await getCsrfToken({
      serverStatus,
      addNotification,
      t,
    });

    if (!csrfToken) {
      addNotification({
        type: "error",
        message: t("messages.csrfTokenFailed"),
      });
      return;
    }

    const response = await guardedFetch(
      `${SERVER_URL}/auth/login`,
      {
        mode: "cors",
        method: "POST",
        credentials: "include",
        headers: {
          "x-csrf-token": csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inputFields.email,
          password: inputFields.password,
        }),
      },
      { serverStatus },
    );

    if (!response.ok) {
      const serverMessage = await getErrorMessage(response);
      if (serverMessage) {
        console.warn("Login request failed:", serverMessage);
      }
      addNotification({
        type: "error",
        message: t("messages.auth.loginFailed"),
      });
      return;
    }
    const result = loginResponseSchema.parse(await response.json());
    addNotification({
      type: "success",
      message: t("messages.auth.loginSuccess"),
    });
    setUserData(result.data);

    clearCsrfToken();
    void navigate("/");
  } catch (err) {
    if (isServerNotReadyError(err)) {
      return;
    }
    addNotification({
      type: "error",
      message: t("messages.auth.loginError"),
    });
    console.error(err);
  } finally {
    setLoading(false);
  }
};

export { handleSubmitLogIn };
