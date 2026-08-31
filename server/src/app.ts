import express from "express";
const app = express();
import cors from "cors";
import { env } from "./config/env.js";

import { RequestValidationError } from "./errors/RequestValidationError.js";

import type { Request, Response, NextFunction } from "express";

import { sessionMiddleware } from "./config/sessionMiddleware.js";
import { passport } from "./config/passport.js";

import helmet from "helmet";
import * as rateLimiter from "./utils/rateLimiter.js";

import { csrfSync } from "csrf-sync";
import { csrfRouter } from "./routes/csrfRouter.js";
const { csrfSynchronisedProtection } = csrfSync();

import compression from "compression";

import { logger } from "./utils/logger.js";

import { sendError } from "./utils/response.js";

import { apiRouter } from "./routes/apiRouter.js";
import { authRouter } from "./routes/authRouter.js";
import { usersRouter } from "./routes/usersRouter.js";
import { healthRouter } from "./routes/healthRouter.js";

// Trust first proxy (required for Koyeb)
app.set("trust proxy", 1);

app.use(rateLimiter.global);

app.use((req, _res, next) => {
  logger.info(
    `${req.method} method to ${req.originalUrl} from ${String(req.ip)}`,
  );
  next();
});

app.use(helmet());
app.use(compression());

// Public routes
app.use("/health", cors(), healthRouter);
app.use("/api", cors(), rateLimiter.api, apiRouter);

app.use(
  cors({
    origin: env.WEBAPP_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(sessionMiddleware);
app.use(passport.session());

app.use(csrfRouter);

app.use("/auth", rateLimiter.auth, authRouter);
app.use("/users", rateLimiter.users, csrfSynchronisedProtection, usersRouter);

app.use((_req, res) => {
  sendError(res, {
    status: 404,
    message: "Route not found: check the URL and HTTP method.",
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof RequestValidationError) {
    sendError(res, {
      status: error.status,
      code: error.code,
      message: error.message,
      issues: error.issues,
    });
    return;
  }

  logger.error(error);

  sendError(res, {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Server error: please try again later.",
  });
});

export { app };
