import * as Sentry from "@sentry/node";
import { env } from "./config/env.js";
import { loggablePath } from "./utils/requestLogger.js";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [
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
    beforeSend(event) {
      // the password-reset token is in the path, which no setting covers
      if (event.request?.url) {
        event.request.url = loggablePath(event.request.url);
      }
      return event;
    },
  });
}
