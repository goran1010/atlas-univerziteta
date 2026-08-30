import { SERVER_URL } from "./envConfig";
import { readResponseError } from "../schemas/api";
import { getCsrfToken, isCsrfTokenError } from "./getCsrfToken";
import { guardedFetch } from "./guardedFetch";
import { isServerNotReadyError } from "./serverStatus";

import type { z } from "zod";
import type { ServerStatus } from "./serverStatus";
import type { TFunction } from "../types/i18n";
import type { AddNotification } from "../types/notification";

interface RequestContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
  serverStatus: ServerStatus;
}

interface ApiMutationConfig<Schema extends z.ZodType> {
  path: string;
  method: "POST" | "PUT" | "DELETE";
  body?: unknown;
  responseSchema: Schema;
  successMessageKey: string;
  errorMessageKey: string;
  caughtErrorMessageKey?: string;
  logLabel: string;
}

/**
 * Sends an authorized mutation to the API: toggles loading, fetches the CSRF
 * token, performs the request and shows a success or error notification.
 * Returns the parsed response on success, or null after any handled failure.
 */
async function apiMutation<Schema extends z.ZodType>(
  {
    path,
    method,
    body,
    responseSchema,
    successMessageKey,
    errorMessageKey,
    caughtErrorMessageKey = errorMessageKey,
    logLabel,
  }: ApiMutationConfig<Schema>,
  { addNotification, setLoading, t, serverStatus }: RequestContext,
): Promise<z.output<Schema> | null> {
  try {
    setLoading(true);
    const csrfToken = await getCsrfToken({ serverStatus, addNotification, t });

    const options: RequestInit = {
      method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await guardedFetch(`${SERVER_URL}${path}`, options, {
      serverStatus,
    });

    if (response.ok) {
      const result = responseSchema.parse(await response.json());
      addNotification({
        type: "success",
        message: t(successMessageKey),
      });
      return result;
    }

    const serverMessage = await readResponseError(response);
    if (serverMessage) {
      console.warn(`Failed to ${logLabel}:`, serverMessage);
    }
    addNotification({
      type: "error",
      message: t(errorMessageKey),
    });
    return null;
  } catch (error) {
    // both already produced a user-facing notification (or must stay silent)
    if (isServerNotReadyError(error) || isCsrfTokenError(error)) {
      return null;
    }
    addNotification({
      type: "error",
      message: t(caughtErrorMessageKey),
    });
    console.error(`Error trying to ${logLabel}:`, error);
    return null;
  } finally {
    setLoading(false);
  }
}

export { apiMutation };
export type { ApiMutationConfig, RequestContext };
