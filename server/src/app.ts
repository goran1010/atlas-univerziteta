import express from "express";
const app = express();
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./config/auth.js";

import { RequestValidationError } from "./errors/RequestValidationError.js";

import type { Request, Response, NextFunction } from "express";

import helmet from "helmet";
import * as rateLimiter from "./utils/rateLimiter.js";

import compression from "compression";

import { logger } from "./utils/logger.js";

import { sendError } from "./utils/response.js";

import { apiRouter } from "./routes/apiRouter.js";
import * as apiController from "./controllers/apiController.js";
import { usersRouter } from "./routes/usersRouter.js";
import { healthRouter } from "./routes/healthRouter.js";

// Trust first proxy (Caddy reverse proxy)
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
app.get("/", cors(), apiController.root);
app.use("/health", cors(), healthRouter);
app.use("/api", cors(), rateLimiter.api, apiRouter);

app.use(
  cors({
    origin: env.WEBAPP_URL,
    credentials: true,
  }),
);

// BetterAuth handler must be mounted before express.json()
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/users", rateLimiter.users, usersRouter);

app.use((_req, res) => {
  sendError(res, {
    status: 404,
    code: "NOT_FOUND",
    message: "Route not found: check the URL and HTTP method.",
  });
});

interface ClientHttpError extends Error {
  status: number;
  code?: unknown;
}

function isClientHttpError(error: unknown): error is ClientHttpError {
  if (!(error instanceof Error) || !("status" in error)) return false;
  const { status } = error;
  return typeof status === "number" && status >= 400 && status < 500;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- express only treats 4-arg middleware as an error handler, so _next must stay
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
      code: "REQUEST_FAILED",
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
