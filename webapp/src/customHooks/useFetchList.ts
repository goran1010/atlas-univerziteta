import { use, useEffect, useRef, useState } from "react";
import { RootContext } from "../contextData/RootContext";
import { SERVER_URL } from "../utils/envConfig";
import { guardedFetch } from "../utils/guardedFetch";
import { readResponseError } from "../schemas/api";
import { SERVER_STATUS, isServerNotReadyError } from "../utils/serverStatus";

import type { Dispatch, SetStateAction } from "react";
import type { ZodType } from "zod";

interface UseFetchListOptions<Item> {
  path: string;
  responseSchema: ZodType<{ data: Item[] }>;
  errorMessageKey: string;
  successMessageKey?: string;
  logLabel: string;
  setLoading: (loading: boolean) => void;
  enabled?: boolean;
}

function useFetchList<Item>({
  path,
  responseSchema,
  errorMessageKey,
  successMessageKey,
  logLabel,
  setLoading,
  enabled = true,
}: UseFetchListOptions<Item>): [Item[], Dispatch<SetStateAction<Item[]>>] {
  const { addNotification, serverStatus, t } = use(RootContext);
  const [items, setItems] = useState<Item[]>([]);

  // notifications should use the language active when the fetch settles,
  // without a language switch re-triggering the fetch
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    if (!enabled) return;
    if (serverStatus !== SERVER_STATUS.LIVE) {
      setLoading(false);
      return;
    }
    const fetchItems = async () => {
      try {
        setLoading(true);

        const response = await guardedFetch(
          `${SERVER_URL}${path}`,
          {
            method: "GET",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
          { serverStatus },
        );

        if (response.ok) {
          const result = responseSchema.parse(await response.json());
          setItems(result.data);
          if (successMessageKey) {
            addNotification({
              type: "success",
              message: tRef.current(successMessageKey),
            });
          }
          return;
        }

        const serverMessage = await readResponseError(response);
        if (serverMessage) {
          console.warn(`Failed to ${logLabel}:`, serverMessage);
        }
        addNotification({
          type: "error",
          message: tRef.current(errorMessageKey),
        });
      } catch (error) {
        if (isServerNotReadyError(error)) {
          return;
        }
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
    responseSchema,
    serverStatus,
    setLoading,
    successMessageKey,
  ]);

  return [items, setItems];
}

export { useFetchList };
