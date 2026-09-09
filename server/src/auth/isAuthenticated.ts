import { sendError } from "../utils/response.js";

import type { Request, Response, NextFunction } from "express";

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      next();
      return;
    }

    sendError(res, {
      status: 401,
      code: "AUTH_REQUIRED",
      message: "Authentication required: log in and try again.",
    });
  } catch (err) {
    next(err);
  }
}

export { isAuthenticated };
