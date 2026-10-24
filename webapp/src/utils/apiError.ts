import type { ApiError } from "../schemas/api";
import type { TFunction } from "../types";

// Notification messages for API error codes whose cause and fix are the same
// wherever they occur; other codes fall back to the caller's own message key.
const CODE_MESSAGE_KEYS: Record<string, string> = {
  RATE_LIMITED: "messages.apiError.rateLimited",
  AUTH_REQUIRED: "messages.apiError.authRequired",
  FORBIDDEN: "messages.apiError.forbidden",
  ALREADY_ADMIN: "messages.apiError.alreadyAdmin",
};

function notificationMessageKey(
  code: string | undefined,
  fallbackKey: string,
): string {
  if (!code) return fallbackKey;
  return CODE_MESSAGE_KEYS[code] ?? fallbackKey;
}

// The translated summary plus whatever specifics the server sent back:
// validation failures list their per-field issues, other unmapped errors
// show the server's own message. Codes with a dedicated translation are
// already specific, so nothing is appended to those.
function notificationMessage(
  t: TFunction,
  fallbackKey: string,
  serverError: ApiError | null | undefined,
): string {
  const summary = t(notificationMessageKey(serverError?.code, fallbackKey));
  if (!serverError) return summary;

  if (serverError.issues?.length) {
    const details = serverError.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("; ");
    return `${summary} (${details})`;
  }

  const hasDedicatedKey =
    serverError.code !== undefined && serverError.code in CODE_MESSAGE_KEYS;
  if (!hasDedicatedKey && serverError.message) {
    return `${summary} (${serverError.message})`;
  }

  return summary;
}

export { notificationMessage, notificationMessageKey };
