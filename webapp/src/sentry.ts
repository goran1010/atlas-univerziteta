import * as Sentry from "@sentry/react";
import { SENTRY_DSN } from "./utils/envConfig";

// The visitor's connection failing, not a bug. Exact matches, so a lazy
// route chunk that fails to load ("Failed to fetch dynamically imported
// module") still reports.
const NETWORK_FAILURES = [
  /^Failed to fetch$/, // Chromium
  /^NetworkError when attempting to fetch resource\.$/, // Firefox
  /^Load failed$/, // Safari
];

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    // the same rule as the server: an error-level log becomes an issue
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
    ignoreErrors: NETWORK_FAILURES,
    // the default appends the host to the real error's message, which the
    // exact matches above would then miss
    enhanceFetchErrorMessages: false,
    denyUrls: [
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      /^safari-web-extension:\/\//,
    ],
    // sign-in and sign-up request bodies carry passwords
    dataCollection: { httpBodies: [] },
  });
}
