import { API_URL } from "./envConfig";
import { readResponseError } from "../schemas/api";
import { notificationMessage } from "./apiError";
import { InvalidResponseError, parseResponse } from "./parseResponse";

import type { z } from "zod";
import type { RequestContext, TranslationKey } from "../types";

interface ApiMutationConfig<Schema extends z.ZodType> {
  path: string;
  method: "POST" | "PUT" | "DELETE";
  body?: unknown;
  responseSchema: Schema;
  successMessageKey: TranslationKey;
  errorMessageKey: TranslationKey;
  caughtErrorMessageKey?: TranslationKey;
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

    const response = await fetch(`${API_URL}${path}`, options);

    if (response.ok) {
      const result = parseResponse(path, responseSchema, await response.json());
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
      message: notificationMessage(t, errorMessageKey, serverError),
    });
    return null;
  } catch (error) {
    console.error(`Error trying to ${logLabel}:`, error);
    // the server already applied the request, so an error toast would
    // invite a duplicate submission
    if (error instanceof InvalidResponseError) {
      addNotification({
        type: "warning",
        message: t("messages.apiError.invalidMutationResponse"),
      });
      return null;
    }
    addNotification({
      type: "error",
      message: t(caughtErrorMessageKey),
    });
    return null;
  } finally {
    setLoading(false);
  }
}

export { apiMutation };
export type { ApiMutationConfig };
