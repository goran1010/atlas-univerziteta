import { SERVER_URL } from "../../../utils/envConfig";
import { readErrorMessage } from "../../../schemas/api";
import { signupResponseSchema } from "../../../schemas/auth";
import { getCsrfToken } from "../../../utils/getCsrfToken";
import { guardedFetch } from "../../../utils/guardedFetch";
import { isServerNotReadyError } from "../../../utils/serverStatus";
import type { SubmitEvent } from "react";
import type { AddNotification } from "../../../types/notification";
import type { TFunction } from "../../../types/i18n";
import type { ServerStatus } from "../../../utils/serverStatus";
import type { NavigateFunction } from "react-router";

type HandleSignUpSubmit = (
  event: SubmitEvent<HTMLFormElement>,
  setLoading: (loading: boolean) => void,
  inputFields: {
    email: string;
    password: string;
    "confirm-password": string;
  },
  addNotification: AddNotification,
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

const handleSignUpSubmit: HandleSignUpSubmit = async function (
  event,
  setLoading,
  inputFields,
  addNotification,
  navigate,
  t,
  serverStatus,
) {
  try {
    event.preventDefault();

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
      `${SERVER_URL}/auth/signup`,
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
          "confirm-password": inputFields["confirm-password"],
        }),
      },
      { serverStatus },
    );

    if (!response.ok) {
      const serverMessage = await getErrorMessage(response);
      if (serverMessage) {
        console.warn("Signup request failed:", serverMessage);
      }
      addNotification({
        type: "error",
        message: t("messages.auth.registrationFailed"),
      });
      return;
    }
    signupResponseSchema.parse(await response.json());
    addNotification({
      type: "success",
      message: t("messages.auth.registrationSuccess"),
    });
    void navigate("/login");
  } catch (err) {
    if (isServerNotReadyError(err)) {
      return;
    }
    addNotification({
      type: "error",
      message: t("messages.auth.registrationError"),
    });
    console.error("Error during registration:", err);
  } finally {
    setLoading(false);
  }
};

export { handleSignUpSubmit };
