import { useEffect, useState, useRef } from "react";
import { SERVER_URL } from "../utils/envConfig";
import { currentUserResponseSchema } from "../schemas/auth";

import type { AddNotification } from "../types";
import type { UserData } from "../types";

function useStatusCheck(
  addNotification: AddNotification,
  t: (key: string) => string,
) {
  const [userData, setUserData] = useState<UserData>(null);
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    async function checkLogin() {
      try {
        const response = await fetch(`${SERVER_URL}/users/me`, {
          mode: "cors",
          method: "GET",
          credentials: "include",
          signal: abortController.signal,
        });

        if (!response.ok) {
          const message = tRef.current("messages.loginStatus.error");

          if (isCancelled) {
            return;
          }

          addNotification({
            type: "error",
            message,
          });

          return;
        }

        const result = currentUserResponseSchema.parse(await response.json());

        if (isCancelled || !result.data) {
          return;
        }

        addNotification({
          type: "success",
          message: tRef.current("messages.loginStatus.success"),
        });

        setUserData(result.data);
      } catch (err) {
        if (isCancelled) {
          return;
        }

        addNotification({
          type: "error",
          message: tRef.current("messages.loginStatus.error"),
        });

        console.error("Error checking login status:", err);
      }
    }

    void checkLogin();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [addNotification]);

  return { userData, setUserData };
}

export { useStatusCheck };
