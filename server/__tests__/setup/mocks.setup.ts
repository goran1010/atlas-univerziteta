import "dotenv/config";
import { vi } from "vitest";

import type { Request, Response, NextFunction } from "express";

vi.mock("../../src/email/confirmationEmail.js", () => ({
  sendConfirmationEmail: vi.fn(() => {
    return { success: true };
  }),
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

vi.mock("csrf-sync", async () => {
  const originalModule = await vi.importActual("csrf-sync");
  return {
    ...originalModule,
    csrfSync: () => {
      return {
        csrfSynchronisedProtection: (
          _req: Request,
          _res: Response,
          next: NextFunction,
        ) => {
          next();
        },
        generateToken: () => {
          return "mocked-csrf-token";
        },
      };
    },
  };
});

vi.mock("../../src/utils/rateLimiter.js", async () => {
  const originalModule = await vi.importActual(
    "../../src/utils/rateLimiter.js",
  );
  return {
    ...originalModule,
    global: (_req: Request, _res: Response, next: NextFunction) => {
      next();
    },
    auth: (_req: Request, _res: Response, next: NextFunction) => {
      next();
    },
    api: (_req: Request, _res: Response, next: NextFunction) => {
      next();
    },
    users: (_req: Request, _res: Response, next: NextFunction) => {
      next();
    },
  };
});
