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

// Errors created via the http-errors package (csrf-sync, body parsing, ...).
// A 4xx status means the request was at fault and the message is safe to send.
interface ClientHttpError extends Error {
  status: number;
  code?: unknown;
}

function isClientHttpError(error: unknown): error is ClientHttpError {
  if (!(error instanceof Error)) return false;
  const status = (error as Partial<ClientHttpError>).status;
  return typeof status === "number" && status >= 400 && status < 500;
}

// eslint-disable-next-line
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof RequestValidationError) {
    logger.warn(
      { issues: error.issues, method: req.method, url: req.originalUrl },
      "Request validation failed.",
    );
    sendError(res, {
      status: error.status,
      code: error.code,
      message: error.message,
      issues: error.issues,
    });
    return;
  }

  if (isClientHttpError(error)) {
    logger.warn(
      { err: error, method: req.method, url: req.originalUrl },
      "Request failed with a client error.",
    );
    sendError(res, {
      status: error.status,
      ...(typeof error.code === "string" && { code: error.code }),
      message: error.message,
    });
    return;
  }

  logger.error(
    { err: error, method: req.method, url: req.originalUrl },
    "Unhandled error.",
  );

  sendError(res, {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Server error: please try again later.",
  });
});

export { app };
