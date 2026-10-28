import "dotenv/config";
import { vi } from "vitest";

import type { Request, Response, NextFunction } from "express";

vi.mock("../../src/email/confirmationEmail.js", () => ({
  sendConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/email/resetPasswordEmail.js", () => ({
  sendResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("pino", () => {
  return {
    default: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  };
});

vi.mock("../../src/utils/rateLimiter.js", async () => {
  const originalModule = await vi.importActual(
    "../../src/utils/rateLimiter.js",
  );
  // vi.fn wrappers that skip limiting so tests can assert a limiter is mounted
  return {
    ...originalModule,
    global: vi.fn((_req: Request, _res: Response, next: NextFunction) => {
      next();
    }),
    auth: vi.fn((_req: Request, _res: Response, next: NextFunction) => {
      next();
    }),
    authGeneral: vi.fn((_req: Request, _res: Response, next: NextFunction) => {
      next();
    }),
    api: vi.fn((_req: Request, _res: Response, next: NextFunction) => {
      next();
    }),
    users: vi.fn((_req: Request, _res: Response, next: NextFunction) => {
      next();
    }),
  };
});
