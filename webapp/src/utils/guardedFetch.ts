import { SERVER_STATUS, ServerNotReadyError } from "./serverStatus";

import type { ServerStatus } from "./serverStatus";

export type Url = string;
export type FetchOptions = Parameters<typeof fetch>[1];
export interface Guard {
  serverStatus: ServerStatus;
}

export type GuardedFetch = (
  url: Url,
  options: FetchOptions,
  guard: Guard,
) => Promise<Response>;

// The free-tier backend sleeps when idle. While it is waking (or down),
// requests would only pile up timeouts - callers treat ServerNotReadyError
// as "wait until the status banner clears".
const guardedFetch: GuardedFetch = (url, options, guard) => {
  const { serverStatus } = guard;
  const shouldBlock =
    serverStatus === SERVER_STATUS.WAKING ||
    serverStatus === SERVER_STATUS.DOWN;

  if (shouldBlock) {
    throw new ServerNotReadyError(serverStatus);
  }

  return fetch(url, options);
};

export { guardedFetch };
