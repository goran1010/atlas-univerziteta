import * as Sentry from "@sentry/node";
import { env } from "./config/env.js";
import { loggablePath } from "./utils/requestLogger.js";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [
      // every log line goes to Sentry Logs, and an error line also becomes
      // an issue; fatal lines do not, since the crash handler reports the
      // same crash
      Sentry.pinoIntegration({ error: { levels: ["error"] } }),
      // reports the rejection without also printing a plain-text warning;
      // index.ts logs it as JSON
      Sentry.onUnhandledRejectionIntegration({ mode: "none" }),
    ],
    dataCollection: {
      // the session cookie is the login
      cookies: false,
      // incoming bodies carry passwords; outgoing ones carry the OAuth client
      // secret and code, and the links in emails
      httpBodies: [],
      // the SDK's name filter does not catch OAuth's code and state
      urlQueryParams: false,
    },
    beforeSend(event, hint) {
      // better-auth also logs client mistakes at error level, some with the
      // client's input in the message; only its lines with an Error (real
      // exceptions) become issues, the rest stay in the logs
      const fromBetterAuth =
        event.contexts?.["pino"]?.["source"] === "better-auth";
      if (fromBetterAuth && !(hint.originalException instanceof Error)) {
        return null;
      }

      // the password-reset token is in the path, which no setting covers
      if (event.request?.url) {
        event.request.url = loggablePath(event.request.url);
      }
      if (event.transaction) {
        event.transaction = loggablePath(event.transaction);
      }
      return event;
    },
  });
}
