import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import type { Request, Response } from "express";

async function status(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    sendError(res, {
      status: 503,
      code: "UNAVAILABLE",
      message: "Database unreachable.",
    });
    return;
  }

  sendSuccess(res, {
    data: {
      status: "ok",
      database: "ok",
    },
    message: "Server is healthy",
  });
}

export { status };
