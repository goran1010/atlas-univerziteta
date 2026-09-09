// Notification messages for API error codes whose cause and fix are the same
// wherever they occur; other codes fall back to the caller's own message key.
const CODE_MESSAGE_KEYS: Record<string, string> = {
  RATE_LIMITED: "messages.apiError.rateLimited",
  AUTH_REQUIRED: "messages.apiError.authRequired",
  FORBIDDEN: "messages.apiError.forbidden",
  CSRF_TOKEN_INVALID: "messages.apiError.csrfInvalid",
  ALREADY_LOGGED_IN: "messages.apiError.alreadyLoggedIn",
  ALREADY_ADMIN: "messages.apiError.alreadyAdmin",
};

function notificationMessageKey(
  code: string | undefined,
  fallbackKey: string,
): string {
  if (!code) return fallbackKey;
  return CODE_MESSAGE_KEYS[code] ?? fallbackKey;
}

export { notificationMessageKey };
