import { prisma } from "../db/prisma.js";
import { enrichWithCurrentEntity } from "../models/pendingChangeModel.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import * as contributionValidation from "../validation/contributionValidation.js";
import type { Request, Response } from "express";
import type { entityType } from "../generated/prisma/enums.js";

async function entityExists(entityType: entityType, id: number) {
  switch (entityType) {
    case "UNIVERSITY":
      return (await prisma.university.findUnique({ where: { id } })) !== null;
    case "FACULTY":
      return (await prisma.faculty.findUnique({ where: { id } })) !== null;
    case "STUDY_PROGRAM":
      return (await prisma.studyProgram.findUnique({ where: { id } })) !== null;
    case "TRACK":
      return (await prisma.track.findUnique({ where: { id } })) !== null;
  }
}

async function parentEntityExists(entityType: entityType, parentId: number) {
  switch (entityType) {
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
  if (!req.user) {
    sendError(res, {
      status: 401,
      message: "Authentication required: log in and try again.",
    });
    return;
  }

  const contribution = contributionValidation.createEntity(req.body);
  const { entityType, data } = contribution;
  const parentId = "parentId" in contribution ? contribution.parentId : null;

  try {
    if (
      parentId !== null &&
      !(await parentEntityExists(entityType, parentId))
    ) {
      sendError(res, {
        status: 404,
        message: "Parent entity not found.",
      });
      return;
    }

    const result = await prisma.pendingChange.create({
      data: {
        user: {
          connect: {
            id: req.user.id,
          },
        },
        entityType,
        typeOfChange: "CREATE",
        parentId,
        data,
      },
    });

    sendSuccess(res, {
      status: 201,
      message: "Suggestion submitted. An admin will review it.",
      data: result,
    });
    return;
  } catch (err) {
    logger.error(err);
    sendError(res, {
      status: 500,
      message: "An error occurred while submitting the suggestion.",
    });
  }
}

async function editEntity(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      message: "Authentication required: log in and try again.",
    });
    return;
  }
  const { entityType, targetId, data } = contributionValidation.editEntity(
    req.body,
  );

  try {
    if (!(await entityExists(entityType, targetId))) {
      sendError(res, {
        status: 404,
        message: "Target entity not found.",
      });
      return;
    }

    const result = await prisma.pendingChange.create({
      data: {
        user: {
          connect: {
            id: req.user.id,
          },
        },

        entityType,
        typeOfChange: "UPDATE",
        targetId,
        data,
      },
    });

    sendSuccess(res, {
      status: 201,
      message: "Edit suggestion submitted. An admin will review it.",
      data: result,
    });
  } catch (err) {
    logger.error(err);
    sendError(res, {
      status: 500,
      message: "An error occurred while submitting the edit suggestion.",
    });
  }
}

async function deleteEntity(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      message: "Authentication required: log in and try again.",
    });
    return;
  }
  const { entityType, targetId } = contributionValidation.deleteEntity(
    req.body,
  );

  try {
    if (!(await entityExists(entityType, targetId))) {
      sendError(res, {
        status: 404,
        message: "Target entity not found.",
      });
      return;
    }

    const result = await prisma.pendingChange.create({
      data: {
        user: {
          connect: {
            id: req.user.id,
          },
        },
        entityType,
        typeOfChange: "DELETE",
        targetId,
        data: {},
      },
    });

    sendSuccess(res, {
      status: 201,
      message: "Deletion suggestion submitted. An admin will review it.",
      data: result,
    });
  } catch (err) {
    logger.error(err);
    sendError(res, {
      status: 500,
      message: "An error occurred while submitting the deletion suggestion.",
    });
  }
}

async function getPendingChanges(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      message: "Authentication required: log in and try again.",
    });
    return;
  }
  const { id } = req.user;
  const pendingChanges = await prisma.pendingChange.findMany({
    where: { userId: id },
  });

  const enriched = await enrichWithCurrentEntity(pendingChanges);

  sendSuccess(res, {
    data: enriched,
    message: "Pending changes retrieved successfully.",
  });
}

async function deletePendingChange(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, {
      status: 401,
      message: "Authentication required: log in and try again.",
    });
    return;
  }
  const { id } = req.user;
  const { id: pendingChangeId } = contributionValidation.deletePendingChange(
    req.body,
  );

  const pendingChange = await prisma.pendingChange.findMany({
    where: { userId: id, id: pendingChangeId },
  });

  if (pendingChange.length === 0) {
    sendError(res, {
      status: 404,
      message: "Pending change not found.",
    });
    return;
  }

  await prisma.pendingChange.delete({
    where: { id: pendingChangeId },
  });

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
