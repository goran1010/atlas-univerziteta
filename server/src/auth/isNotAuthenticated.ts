import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { sendError } from "../utils/response.js";

import type { Request, Response, NextFunction } from "express";

async function isNotAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      next();
      return;
    }

    sendError(res, {
      status: 403,
      code: "ALREADY_LOGGED_IN",
      message: "Already logged in: log out first.",
    });
  } catch (err) {
    next(err);
  }
}

export { isNotAuthenticated };
