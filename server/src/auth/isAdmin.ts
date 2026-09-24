import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { sendError } from "../utils/response.js";

import type { Request, Response, NextFunction } from "express";

async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      sendError(res, {
        status: 401,
        code: "AUTH_REQUIRED",
        message: "Unauthorized: user not authenticated.",
      });
      return;
    }

    req.user = session.user;

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
