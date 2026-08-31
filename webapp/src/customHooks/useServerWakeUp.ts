import { useEffect, useRef, useState } from "react";
import {
  SERVER_STATUS,
  SERVER_STATUS_NOTIFICATION_ID,
} from "../utils/serverStatus";
import { SERVER_URL } from "../utils/envConfig";
const ALLOWED_ATTEMPTS = 60;
const DELAY_BETWEEN_ATTEMPTS = 1000;

import { type ServerStatus } from "../utils/serverStatus";
import type {
  AddNotification,
  RemoveNotification,
} from "../types/notification";
import type { TFunction } from "../types/i18n";

interface UseServerWakeUp {
  addNotification: AddNotification;
  removeNotification: RemoveNotification;
  t: TFunction;
}

// The free-tier backend sleeps when idle; this hook pings it until it
// responds and drives the app-wide server status.
function useServerWakeUp({
  addNotification,
  removeNotification,
  t,
}: UseServerWakeUp) {
  const [serverStatus, setServerStatus] = useState<ServerStatus>(
    SERVER_STATUS.WAKING,
  );
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    // Limit the number of wake-up attempts to prevent infinite loops
    let currentNumberOfAttempts = 0;

    let retryTimeoutId: number;
    let isCancelled = false;

    function scheduleRetry() {
      addNotification({
        id: SERVER_STATUS_NOTIFICATION_ID,
        type: "warning",
        message: tRef.current("longWait.wakingUp"),
        duration: null,
        persistent: true,
      });
      retryTimeoutId = setTimeout(() => {
        currentNumberOfAttempts++;
        void checkServer();
      }, DELAY_BETWEEN_ATTEMPTS);
    }

    async function checkServer() {
      if (isCancelled) {
        return;
      }

      if (currentNumberOfAttempts >= ALLOWED_ATTEMPTS) {
        setServerStatus(SERVER_STATUS.DOWN);
        addNotification({
          id: SERVER_STATUS_NOTIFICATION_ID,
          type: "error",
          message: tRef.current("longWait.unreachable"),
          duration: null,
          persistent: true,
        });
        console.error(
          "Server can't be reached after multiple attempts. Please try again later.",
        );
        return;
      }

      try {
        const response = await fetch(`${SERVER_URL}/health`, {
          method: "GET",
          mode: "cors",
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          scheduleRetry();
          return;
        }

        setServerStatus(SERVER_STATUS.LIVE);
        removeNotification(SERVER_STATUS_NOTIFICATION_ID);
      } catch (err) {
        console.error(err);
        scheduleRetry();
      }
    }

    void checkServer();

    return () => {
      isCancelled = true;
      clearTimeout(retryTimeoutId);
      removeNotification(SERVER_STATUS_NOTIFICATION_ID);
    };
  }, [addNotification, removeNotification]);

  return serverStatus;
}

export { useServerWakeUp };
