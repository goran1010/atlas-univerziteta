import { SERVER_URL } from "./envConfig";
import { readResponseError } from "../schemas/api";
import { notificationMessageKey } from "./apiError";

import type { z } from "zod";
import type { TFunction } from "../types";
import type { AddNotification } from "../types";

interface RequestContext {
  addNotification: AddNotification;
  setLoading: (loading: boolean) => void;
  t: TFunction;
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
  { addNotification, setLoading, t }: RequestContext,
): Promise<z.output<Schema> | null> {
  try {
    setLoading(true);

    const options: RequestInit = {
      method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SERVER_URL}${path}`, options);

    if (response.ok) {
      const result = responseSchema.parse(await response.json());
      addNotification({
        type: "success",
        message: t(successMessageKey),
      });
      return result;
    }

    const serverError = await readResponseError(response);
    if (serverError) {
      console.warn(`Failed to ${logLabel}:`, serverError.message);
    }
    addNotification({
      type: "error",
      message: t(notificationMessageKey(serverError?.code, errorMessageKey)),
    });
    return null;
  } catch (error) {
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
