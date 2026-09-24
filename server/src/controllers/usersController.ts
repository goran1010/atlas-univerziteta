import { fromNodeHeaders } from "better-auth/node";
import { prisma } from "../db/prisma.js";
import { auth } from "../config/auth.js";
import { sendError, sendSuccess } from "../utils/response.js";

import type { Request, Response } from "express";

async function me(req: Request, res: Response) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    sendSuccess(res, {
      message: "No user logged in",
      data: null,
    });
    return;
  }

  sendSuccess(res, {
    message: "User info retrieved",
    data: session.user,
  });
}

function logout(_req: Request, res: Response) {
  sendSuccess(res, {
    message: "User logged out successfully",
  });
}

async function requestAdmin(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      code: "AUTH_REQUIRED",
      message: "You must be logged in to request admin access.",
    });
    return;
  }

  if (req.user.role === "ADMIN") {
    sendError(res, {
      status: 400,
      code: "ALREADY_ADMIN",
      message: "You already have the admin role.",
    });
    return;
  }

  const { adminRequestedAt } = await prisma.user.update({
    where: { id: req.user.id },
    data: { adminRequestedAt: new Date() },
  });

  sendSuccess(res, {
    message: "Admin access requested. An admin will review it.",
    data: { adminRequestedAt },
  });
}

async function cancelAdminRequest(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      code: "AUTH_REQUIRED",
      message: "You must be logged in to cancel an admin request.",
    });
    return;
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { adminRequestedAt: null },
  });

  sendSuccess(res, {
    message: "Admin request cancelled.",
  });
}

export { logout, me, requestAdmin, cancelAdminRequest };
