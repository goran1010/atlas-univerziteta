import { use, useEffect, useRef, useState } from "react";
import { RootContext } from "../contextData/RootContext";
import { NotificationContext } from "../contextData/NotificationContext";
import { SERVER_URL } from "../utils/envConfig";
import { readResponseError } from "../schemas/api";
import { notificationMessageKey } from "../utils/apiError";

import type { Dispatch, SetStateAction } from "react";
import type { ZodType } from "zod";

interface UseUsersListOptions<Item> {
  path: string;
  responseSchema: ZodType<{ data: Item[] }>;
  errorMessageKey: string;
  logLabel: string;
  setLoading: (loading: boolean) => void;
  enabled?: boolean;
  refetchKey?: number;
}

function useUsersList<Item>({
  path,
  responseSchema,
  errorMessageKey,
  logLabel,
  setLoading,
  enabled = true,
  refetchKey = 0,
}: UseUsersListOptions<Item>): [Item[], Dispatch<SetStateAction<Item[]>>] {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const [items, setItems] = useState<Item[]>([]);

  // notifications should use the language active when the fetch settles,
  // without a language switch re-triggering the fetch
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    if (!enabled) return;
    const fetchItems = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${SERVER_URL}${path}`, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const result = responseSchema.parse(await response.json());
          setItems(result.data);
          return;
        }

        const serverError = await readResponseError(response);
        if (serverError) {
          console.warn(`Failed to ${logLabel}:`, serverError.message);
        }
        addNotification({
          type: "error",
          message: tRef.current(
            notificationMessageKey(serverError?.code, errorMessageKey),
          ),
        });
      } catch (error) {
        console.error(`Error trying to ${logLabel}:`, error);
        addNotification({
          type: "error",
          message: tRef.current(errorMessageKey),
        });
      } finally {
        setLoading(false);
      }
    };
    void fetchItems();
  }, [
    addNotification,
    enabled,
    errorMessageKey,
    logLabel,
    path,
    refetchKey,
    responseSchema,
    setLoading,
  ]);

  return [items, setItems];
}

export { useUsersList };
