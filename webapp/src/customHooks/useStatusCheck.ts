import { useEffect, useState, useRef } from "react";
import { authClient } from "../utils/authClient";

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

    async function checkLogin() {
      try {
        const { data: session, error } = await authClient.getSession();

        if (isCancelled) return;

        if (error || !session) return;

        setUserData(session.user);
      } catch (err) {
        if (isCancelled) return;

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
    };
  }, [addNotification]);

  return { userData, setUserData };
}

export { useStatusCheck };
