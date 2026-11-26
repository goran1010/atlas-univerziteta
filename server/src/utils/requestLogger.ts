import { logger } from "./logger.js";

import type { Request, Response, NextFunction } from "express";

// Query strings carry email-verification tokens and OAuth codes, and
// better-auth puts the password-reset token in the path, so neither may
// reach the logs.
function loggablePath(url: string) {
  return url
    .replace(/\?.*$/, "")
    .replace(/\/reset-password\/[^/]+/, "/reset-password/[redacted]");
}

// Docker's health check calls it every 30 seconds
const HEALTH_CHECK = /^\/health\/?$/;

// One line per request, written once the response is done, so it carries
// the status and the duration.
function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = performance.now();
  const fields = {
    method: req.method,
    path: loggablePath(req.originalUrl),
    ip: req.ip,
    userAgent: req.get("user-agent"),
  };

  res.on("close", () => {
    const durationMs = Math.round(performance.now() - startedAt);

    if (!res.writableFinished) {
      logger.warn(
        { ...fields, durationMs },
        "Request closed before the response was sent",
      );
      return;
    }

    if (HEALTH_CHECK.test(fields.path) && res.statusCode < 400) return;

    logger.info(
      { ...fields, status: res.statusCode, durationMs },
      "Request completed",
    );
  });

  next();
}

export { loggablePath, requestLogger };
