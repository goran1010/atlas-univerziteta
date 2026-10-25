import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/response.js";
import * as usersValidation from "../validation/usersValidation.js";

import type { Request, Response } from "express";

async function requestAdmin(req: Request, res: Response) {
  const user = req.authSession?.user;

  if (!user) {
    sendError(res, {
      status: 401,
      code: "AUTH_REQUIRED",
      message: "You must be logged in to request admin access.",
    });
    return;
  }

  if (user.role === "ADMIN") {
    sendError(res, {
      status: 400,
      code: "ALREADY_ADMIN",
      message: "You already have the admin role.",
    });
    return;
  }

  const body = usersValidation.requestAdmin(req.body);

  const { adminRequestedAt } = await prisma.user.update({
    where: { id: user.id },
    data: {
      adminRequestedAt: new Date(),
      adminRequestReason: body?.reason ?? null,
    },
  });

  sendSuccess(res, {
    message: "Admin access requested. An admin will review it.",
    data: { adminRequestedAt },
  });
}

async function cancelAdminRequest(req: Request, res: Response) {
  const user = req.authSession?.user;

  if (!user) {
    sendError(res, {
      status: 401,
      code: "AUTH_REQUIRED",
      message: "You must be logged in to cancel an admin request.",
    });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { adminRequestedAt: null, adminRequestReason: null },
  });

  sendSuccess(res, {
    message: "Admin request cancelled.",
  });
}

export { requestAdmin, cancelAdminRequest };
