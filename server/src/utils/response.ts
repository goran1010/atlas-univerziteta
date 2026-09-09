import type { Response } from "express";
import type { ApiValidationIssue } from "../errors/RequestValidationError.js";

type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "ALREADY_LOGGED_IN"
  | "ALREADY_ADMIN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SIGNUP_FAILED"
  | "LOGIN_FAILED"
  | "EMAIL_NOT_SENT"
  | "CONFIRMATION_TOKEN_INVALID"
  | "LOGOUT_FAILED"
  | "CSRF_TOKEN_INVALID"
  | "REQUEST_FAILED"
  | "INTERNAL_SERVER_ERROR";

interface ErrorOptions {
  status?: number;
  message?: string;
  code: ErrorCode;
  issues?: ApiValidationIssue[];
}

interface Options {
  status?: number;
}

export interface SuccessOptions extends Options {
  data?: unknown;
  message?: string | null;
}

function sendSuccess(
  res: Response,
  { status = 200, data = null, message = null }: SuccessOptions = {},
) {
  res.status(status).json({ data, message });
}

function sendError(
  res: Response,
  { status = 500, message = "Request failed.", code, issues }: ErrorOptions,
) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(issues !== undefined && { issues }),
    },
  });
}

export { sendSuccess, sendError };
