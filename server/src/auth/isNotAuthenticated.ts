import { sendError } from "../utils/response.js";

import type { Request, Response, NextFunction } from "express";

function isNotAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    next();
    return;
  }

  sendError(res, {
    status: 403,
    code: "ALREADY_LOGGED_IN",
    message: "Already logged in: log out first.",
  });
}

export { isNotAuthenticated };
