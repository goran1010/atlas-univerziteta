import { prisma } from "../db/prisma.js";
import * as transactionModel from "../models/transactionModel.js";
import { enrichWithCurrentEntity } from "../models/pendingChangeModel.js";
import { sendError, sendSuccess } from "../utils/response.js";
import * as adminValidation from "../validation/adminValidation.js";

import type { Request, Response } from "express";

async function getPendingChanges(_req: Request, res: Response) {
  const pendingChanges = await prisma.pendingChange.findMany({
    include: {
      user: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });

  const enriched = await enrichWithCurrentEntity(pendingChanges);

  sendSuccess(res, {
    data: enriched,
    message: "Pending changes retrieved successfully.",
  });
}

async function declinePendingChange(req: Request, res: Response) {
  const { id } = adminValidation.declinePendingChange(req.body);

  await prisma.pendingChange.delete({ where: { id } });

  sendSuccess(res, {
    message: "Pending change declined successfully.",
  });
}

async function approvePendingChange(req: Request, res: Response) {
  const { id } = adminValidation.approvePendingChange(req.body);

  const wasApplied = await transactionModel.approvePendingChange({
    id,
  });

  if (!wasApplied) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Pending change not found.",
    });
    return;
  }

  sendSuccess(res, {
    message: "Pending change approved successfully.",
  });
}

async function getAdminRequests(_req: Request, res: Response) {
  const adminRequests = await prisma.user.findMany({
    where: {
      adminRequestedAt: { not: null },
      role: "USER",
    },
    select: {
      id: true,
      email: true,
      adminRequestedAt: true,
    },
    orderBy: { adminRequestedAt: "asc" },
  });

  sendSuccess(res, {
    data: adminRequests,
    message: "Admin requests retrieved successfully.",
  });
}

async function approveAdminRequest(req: Request, res: Response) {
  const { id } = adminValidation.approveAdminRequest(req.body);

  // updateMany so a missing user or an already-handled request is a clean 404
  const { count } = await prisma.user.updateMany({
    where: { id, adminRequestedAt: { not: null } },
    data: { role: "ADMIN", adminRequestedAt: null },
  });

  if (count === 0) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Admin request not found.",
    });
    return;
  }

  sendSuccess(res, {
    message: "Admin request approved successfully.",
  });
}

async function declineAdminRequest(req: Request, res: Response) {
  const { id } = adminValidation.declineAdminRequest(req.body);

  const { count } = await prisma.user.updateMany({
    where: { id, adminRequestedAt: { not: null } },
    data: { adminRequestedAt: null },
  });

  if (count === 0) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Admin request not found.",
    });
    return;
  }

  sendSuccess(res, {
    message: "Admin request declined successfully.",
  });
}

export {
  getPendingChanges,
  declinePendingChange,
  approvePendingChange,
  getAdminRequests,
  approveAdminRequest,
  declineAdminRequest,
};
