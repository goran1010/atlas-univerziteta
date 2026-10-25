import { prisma } from "../db/prisma.js";
import { enrichWithCurrentEntity } from "../models/pendingChangeModel.js";
import { sendError, sendSuccess } from "../utils/response.js";
import * as contributionValidation from "../validation/contributionValidation.js";
import type { Request, Response } from "express";
import type { targetType } from "../generated/prisma/enums.js";

function getSessionUser(req: Request) {
  const user = req.authSession?.user;
  if (!user) throw new Error("No session - isAuthenticated middleware missing");
  return user;
}

async function findEntity(targetType: targetType, id: number) {
  switch (targetType) {
    case "UNIVERSITY":
      return prisma.university.findUnique({ where: { id } });
    case "FACULTY":
      return prisma.faculty.findUnique({ where: { id } });
    case "STUDY_PROGRAM":
      return prisma.studyProgram.findUnique({ where: { id } });
    case "TRACK":
      return prisma.track.findUnique({ where: { id } });
  }
}

async function entityExists(targetType: targetType, id: number) {
  return (await findEntity(targetType, id)) !== null;
}

const MAX_OPEN_CHANGES_PER_USER = 20;

// a per-user cap on top of the IP rate limit, so one account cannot flood
// the admin review queue
async function sendLimitErrorIfFull(res: Response, userId: string) {
  const openChanges = await prisma.pendingChange.count({ where: { userId } });
  if (openChanges < MAX_OPEN_CHANGES_PER_USER) return false;

  sendError(res, {
    status: 429,
    code: "CONTRIBUTION_LIMIT",
    message: `You already have ${String(MAX_OPEN_CHANGES_PER_USER)} suggestions awaiting review. Please wait until an admin reviews them.`,
  });
  return true;
}

async function parentEntityExists(targetType: targetType, parentId: number) {
  switch (targetType) {
    case "FACULTY":
      return entityExists("UNIVERSITY", parentId);
    case "STUDY_PROGRAM":
      return entityExists("FACULTY", parentId);
    case "TRACK":
      return entityExists("STUDY_PROGRAM", parentId);
    case "UNIVERSITY":
      return true;
  }
}

async function createEntity(req: Request, res: Response) {
  const user = getSessionUser(req);

  const contribution = contributionValidation.createEntity(req.body);
  const { targetType, data, comment } = contribution;
  const parentId = "parentId" in contribution ? contribution.parentId : null;

  if (await sendLimitErrorIfFull(res, user.id)) return;

  if (parentId !== null && !(await parentEntityExists(targetType, parentId))) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Parent entity not found.",
    });
    return;
  }

  const result = await prisma.pendingChange.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },
      targetType,
      typeOfChange: "CREATE",
      parentId,
      data,
      comment: comment ?? null,
    },
  });

  sendSuccess(res, {
    status: 201,
    message: "Suggestion submitted. An admin will review it.",
    data: result,
  });
  return;
}

// a proposed value of null means "clear the field", which matches a null
// column; absent keys are not proposed and not compared
function isNoOpEdit(
  data: Record<string, unknown>,
  entity: Record<string, unknown>,
) {
  return Object.entries(data).every(
    ([key, value]) => entity[key] === (value ?? null),
  );
}

async function editEntity(req: Request, res: Response) {
  const user = getSessionUser(req);
  const { targetType, targetId, data, comment } =
    contributionValidation.editEntity(req.body);

  if (await sendLimitErrorIfFull(res, user.id)) return;

  const target = await findEntity(targetType, targetId);
  if (!target) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Target entity not found.",
    });
    return;
  }

  if (isNoOpEdit(data, target)) {
    sendError(res, {
      status: 400,
      code: "NO_CHANGES",
      message: "The suggested edit matches the current data.",
    });
    return;
  }

  const result = await prisma.pendingChange.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },

      targetType,
      typeOfChange: "UPDATE",
      targetId,
      data,
      comment: comment ?? null,
    },
  });

  sendSuccess(res, {
    status: 201,
    message: "Edit suggestion submitted. An admin will review it.",
    data: result,
  });
}

async function deleteEntity(req: Request, res: Response) {
  const user = getSessionUser(req);
  const { targetType, targetId, comment } = contributionValidation.deleteEntity(
    req.body,
  );

  if (await sendLimitErrorIfFull(res, user.id)) return;

  if (!(await entityExists(targetType, targetId))) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Target entity not found.",
    });
    return;
  }

  const result = await prisma.pendingChange.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },
      targetType,
      typeOfChange: "DELETE",
      targetId,
      data: {},
      comment: comment ?? null,
    },
  });

  sendSuccess(res, {
    status: 201,
    message: "Deletion suggestion submitted. An admin will review it.",
    data: result,
  });
}

async function getPendingChanges(req: Request, res: Response) {
  const { id } = getSessionUser(req);
  const pendingChanges = await prisma.pendingChange.findMany({
    where: { userId: id },
    orderBy: { createdAt: "asc" },
  });

  const enriched = await enrichWithCurrentEntity(pendingChanges);

  sendSuccess(res, {
    data: enriched,
    message: "Pending changes retrieved successfully.",
  });
}

async function deletePendingChange(req: Request, res: Response) {
  const { id } = getSessionUser(req);
  const { id: pendingChangeId } = contributionValidation.deletePendingChange(
    req.body,
  );

  // deleteMany so a missing or concurrently-removed change is a clean 404
  const { count } = await prisma.pendingChange.deleteMany({
    where: { userId: id, id: pendingChangeId },
  });

  if (count === 0) {
    sendError(res, {
      status: 404,
      code: "NOT_FOUND",
      message: "Pending change not found.",
    });
    return;
  }

  sendSuccess(res, {
    message: "Pending change deleted successfully.",
  });
}

export {
  createEntity,
  editEntity,
  deleteEntity,
  getPendingChanges,
  deletePendingChange,
};
