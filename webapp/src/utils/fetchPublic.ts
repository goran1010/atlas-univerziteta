import { SERVER_URL } from "./envConfig";
import { readResponseError } from "../schemas/api";
import { notificationMessage } from "./apiError";

import type { z } from "zod";
import type { ApiError } from "../schemas/api";
import type { RequestContext } from "../types";

// GET counterpart of apiMutation: one place for the fetch/parse/notify block
// that public reads used to copy-paste.

type FetchPublicOutcome<Schema extends z.ZodType> =
  | { ok: true; result: z.output<Schema> }
  | { ok: false; status: number; error: ApiError | null };

// Low level: fetch and parse, no UI concerns. For callers with their own
// error handling (search throws its typed error from this).
async function fetchPublicResponse<Schema extends z.ZodType>(
  path: string,
  responseSchema: Schema,
  signal?: AbortSignal,
): Promise<FetchPublicOutcome<Schema>> {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method: "GET",
    mode: "cors",
    ...(signal && { signal }),
  });

  if (response.ok) {
    return { ok: true, result: responseSchema.parse(await response.json()) };
  }
  return {
    ok: false,
    status: response.status,
    error: await readResponseError(response),
  };
}

interface FetchPublicConfig<Schema extends z.ZodType> {
  path: string;
  responseSchema: Schema;
  errorMessageKey: string;
  logLabel: string;
  // detail pages: a missing entity is an expected state, not a toast
  quiet404?: boolean;
}

async function fetchPublic<Schema extends z.ZodType>(
  {
    path,
    responseSchema,
    errorMessageKey,
    logLabel,
    quiet404,
  }: FetchPublicConfig<Schema>,
  { addNotification, setLoading, t }: RequestContext,
): Promise<z.output<Schema> | null> {
  try {
    setLoading(true);

    const outcome = await fetchPublicResponse(path, responseSchema);

    if (outcome.ok) return outcome.result;

    if (quiet404 && outcome.status === 404) return null;

    if (outcome.error) {
      console.warn(`Failed to ${logLabel}:`, outcome.error.message);
    }
    addNotification({
      type: "error",
      message: notificationMessage(t, errorMessageKey, outcome.error),
    });
    return null;
  } catch (error) {
    console.error(`Error trying to ${logLabel}:`, error);
    addNotification({
      type: "error",
      message: t(errorMessageKey),
    });
    return null;
  } finally {
    setLoading(false);
  }
}

export { fetchPublic, fetchPublicResponse };
