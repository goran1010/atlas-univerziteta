import { sendError } from "../utils/response.js";

import type { Request, Response, NextFunction } from "express";

function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      sendError(res, {
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Unauthorized: user not authenticated.",
      });
      return;
    }
    if (req.user.role === "ADMIN") {
      next();
      return;
    }

    sendError(res, {
      status: 403,
      code: "FORBIDDEN",
      message: "Access denied: admin role is required.",
    });
  } catch (err) {
    next(err);
  }
}

export { isAdmin };
