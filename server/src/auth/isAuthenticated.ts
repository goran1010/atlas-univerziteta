import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { sendError } from "../utils/response.js";

import type { Request, Response, NextFunction } from "express";

async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.user = session.user;
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
