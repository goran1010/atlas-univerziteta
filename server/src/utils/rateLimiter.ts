import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const MINUTE = 60 * 1000;
const isProduction = env.NODE_ENV === "production";

function errorMessage(message: string) {
  return { error: { message } };
}

const global = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 500 : 5000,
  message: errorMessage(
    "Too many requests. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

const auth = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 15 : 500,
  message: errorMessage(
    "Too many login attempts. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

const api = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 100 : 5000,
  message: errorMessage(
    "Too many API requests. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

const users = rateLimit({
  windowMs: 15 * MINUTE,
  max: isProduction ? 100 : 5000,
  message: errorMessage(
    "Too many requests. Please wait 15 minutes, then try again.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

export { global, auth, api, users };
