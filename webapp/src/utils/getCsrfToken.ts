import { SERVER_URL } from "./envConfig";
import { csrfTokenResponseSchema } from "../schemas/auth";
import { guardedFetch } from "./guardedFetch";
import { isServerNotReadyError } from "./serverStatus";

import type { ServerStatus } from "./serverStatus";
import type { AddNotification } from "../types/notification";
import type { TFunction } from "../types/i18n";

class CsrfTokenError extends Error {
  constructor(cause: unknown) {
    super("Failed to fetch CSRF token", { cause });
    this.name = "CsrfTokenError";
  }
}

function isCsrfTokenError(error: unknown): error is CsrfTokenError {
  return error instanceof CsrfTokenError;
}

// The server keeps the CSRF token stable for the lifetime of the session,
// so it is fetched once and cached. Logging in or out regenerates the
// session and invalidates the token - those flows call clearCsrfToken().
let cachedToken: string | null = null;

async function getCsrfToken({
  serverStatus,
  addNotification,
  t,
}: {
  serverStatus: ServerStatus;
  addNotification: AddNotification;
  t: TFunction;
}): Promise<string> {
  try {
    if (cachedToken) {
      return cachedToken;
    }

    const csrfResponse = await guardedFetch(
      `${SERVER_URL}/csrf-token`,
      {
        mode: "cors",
        credentials: "include",
      },
      { serverStatus },
    );
    const { data: csrfToken } = csrfTokenResponseSchema.parse(
      await csrfResponse.json(),
    );
    cachedToken = csrfToken;

    return csrfToken;
  } catch (error) {
    if (isServerNotReadyError(error)) {
      throw error;
    }
    addNotification({
      type: "error",
      message: t("messages.csrfTokenFailed"),
    });
    console.error("Error fetching CSRF token:", error);
    throw new CsrfTokenError(error);
  }
}

function clearCsrfToken() {
  cachedToken = null;
}

export { getCsrfToken, clearCsrfToken, CsrfTokenError, isCsrfTokenError };
