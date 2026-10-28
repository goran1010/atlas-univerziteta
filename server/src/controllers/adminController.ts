import { prisma } from "../db/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { approvePendingChange as applyPendingChange } from "../models/applyPendingChange.js";
import { enrichWithCurrentEntity } from "../models/pendingChangeModel.js";
import { sendError, sendSuccess } from "../utils/response.js";
import * as adminValidation from "../validation/adminValidation.js";

import type { Request, Response } from "express";

async function getPendingChanges(_req: Request, res: Response) {
  const pendingChanges = await prisma.pendingChange.findMany({
    orderBy: { createdAt: "asc" },
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

  // deleteMany so an already-removed change is a clean 404
  const { count } = await prisma.pendingChange.deleteMany({ where: { id } });

  if (count === 0) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Pending change not found.",
    });
    return;
  }

  sendSuccess(res, {
    message: "Pending change declined successfully.",
  });
}

// The DB unique constraints are the final duplicate check for approvals
// (submission only validates within the payload). Name the collision so the
// admin can write a useful decline reason instead of seeing a generic error.
function uniqueConflictMessage(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code !== "P2002") return null;

  // depending on the driver, meta.target is the field list or the unique
  // constraint name (e.g. "faculty_name_universityId_key")
  // the violated constraint's location in meta depends on the driver (field
  // list in `target` vs the pg adapter's nested constraint index name), but
  // its name always carries the parent FK column, so match the whole meta
  const metaText = JSON.stringify(error.meta ?? {});

  if (metaText.includes("universityId")) {
    return "A faculty with this name already exists in that university.";
  }
  if (metaText.includes("facultyId")) {
    return "A study program with this name and cycle already exists in that faculty.";
  }
  if (metaText.includes("studyProgramId")) {
    return "A track with this name already exists in that study program.";
  }
  return "A university with this name already exists.";
}

async function approvePendingChange(req: Request, res: Response) {
  const { id } = adminValidation.approvePendingChange(req.body);

  let wasApplied: boolean;
  try {
    wasApplied = await applyPendingChange({ id });
  } catch (error) {
    const conflict = uniqueConflictMessage(error);
    if (conflict === null) throw error;

    sendError(res, { status: 409, code: "CONFLICT", message: conflict });
    return;
  }

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
      adminRequestReason: true,
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
    data: { role: "ADMIN", adminRequestedAt: null, adminRequestReason: null },
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
    data: { adminRequestedAt: null, adminRequestReason: null },
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
