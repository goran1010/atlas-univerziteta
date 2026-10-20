import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

import type { Request, Response, NextFunction } from "express";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// CSRF defense in depth on top of SameSite cookies and credentialed CORS:
// browsers always attach the Origin header to cross-site state-changing
// requests, so a mismatch means the request was not made by the webapp.
// Requests without an Origin header pass - non-browser clients cannot
// carry browser credentials.
function verifyOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (
    !STATE_CHANGING_METHODS.has(req.method) ||
    !origin ||
    origin === env.WEBAPP_URL
  ) {
    next();
    return;
  }

  sendError(res, {
    status: 403,
    code: "FORBIDDEN",
    message: "Request origin is not allowed.",
  });
}

export { verifyOrigin };
