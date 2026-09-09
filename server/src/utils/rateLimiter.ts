import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { sendError } from "./response.js";

import type { Request, Response } from "express";

const MINUTE = 60 * 1000;
const isProduction = env.NODE_ENV === "production";

function rateLimitHandler(message: string) {
  return (_req: Request, res: Response) => {
    sendError(res, {
      status: 429,
      code: "RATE_LIMITED",
      message,
    });
  };
}

const global = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 500 : 5000,
  handler: rateLimitHandler(
    "Too many requests. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

const auth = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 15 : 500,
  handler: rateLimitHandler(
    "Too many login attempts. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

const api = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 100 : 5000,
  handler: rateLimitHandler(
    "Too many API requests. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

const users = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 100 : 5000,
  handler: rateLimitHandler(
    "Too many requests. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

export { global, auth, api, users };
