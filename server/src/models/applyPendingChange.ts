import { prisma } from "../db/prisma.js";
import {
  toUniversityTreeCreateInput,
  toUniversityUpdateInput,
  toFacultyTreeCreateInput,
  toFacultyUpdateInput,
  toStudyProgramTreeCreateInput,
  toStudyProgramUpdateInput,
  toTrackCreateInput,
  toTrackUpdateInput,
} from "./pendingChangeInputs.js";
import { logger } from "../utils/logger.js";
import {
  facultyTreeDataSchema,
  facultyEditDataSchema,
  studyProgramTreeDataSchema,
  studyProgramEditDataSchema,
  trackCreateDataSchema,
  trackEditDataSchema,
  universityTreeDataSchema,
  universityEditDataSchema,
} from "../validation/contributionValidation.js";

import { z } from "zod";

import type { PrismaClient } from "../generated/prisma/client.js";

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
type ApplyResult = "APPLIED" | "NOT_FOUND" | "INVALID_DATA";

interface ApplyContext {
  tx: Tx;
  id: string;
  data: unknown;
  targetId: number | null;
  parentId: number | null;
  typeOfChange: string;
  claim: () => Promise<boolean>;
}

function parsePendingChangeData<T>(
  schema: z.ZodType<T>,
  data: unknown,
  pendingChangeId: string,
): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  logger.warn(
    {
      pendingChangeId,
      issues: result.error.issues,
    },
    "Pending change data failed validation during approval.",
  );
  return null;
}

async function applyUniversity(ctx: ApplyContext): Promise<ApplyResult> {
  const { tx, id, data, targetId, typeOfChange, claim } = ctx;

  if (typeOfChange === "DELETE") {
    if (targetId === null) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.university.delete({ where: { id: targetId } });
    return "APPLIED";
  }

  if (typeOfChange === "CREATE") {
    const parsed = parsePendingChangeData(
      universityTreeDataSchema,
      data,
      id,
    );
    if (!parsed) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.university.create({
      data: toUniversityTreeCreateInput(parsed),
    });
    return "APPLIED";
  }

  if (targetId === null) return "INVALID_DATA";

  const parsed = parsePendingChangeData(universityEditDataSchema, data, id);
  if (!parsed) return "INVALID_DATA";

  const current = await tx.university.findUnique({
    where: { id: targetId },
    select: { country: true, entity: true },
  });

  if (current) {
    const mergedCountry = parsed.country ?? current.country;
    const mergedEntity =
      parsed.entity !== undefined ? parsed.entity : current.entity;
    if (mergedCountry === "BIH" && mergedEntity === null) {
      logger.warn(
        { pendingChangeId: id },
        "Approval rejected: BIH university would have no entity after merge.",
      );
      return "INVALID_DATA";
    }
    if (mergedCountry !== "BIH" && mergedEntity !== null) {
      logger.warn(
        { pendingChangeId: id },
        "Approval rejected: non-BIH university would keep an entity after merge.",
      );
      return "INVALID_DATA";
    }
  }

  if (!(await claim())) return "NOT_FOUND";
  await tx.university.update({
    where: { id: targetId },
    data: toUniversityUpdateInput(parsed),
  });
  return "APPLIED";
}

async function applyFaculty(ctx: ApplyContext): Promise<ApplyResult> {
  const { tx, id, data, targetId, parentId, typeOfChange, claim } = ctx;

  if (typeOfChange === "DELETE") {
    if (targetId === null) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.faculty.delete({ where: { id: targetId } });
    return "APPLIED";
  }

  if (typeOfChange === "CREATE") {
    if (parentId === null) return "INVALID_DATA";
    const parsed = parsePendingChangeData(facultyTreeDataSchema, data, id);
    if (!parsed) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.faculty.create({
      data: toFacultyTreeCreateInput(parsed, parentId),
    });
    return "APPLIED";
  }

  if (targetId === null) return "INVALID_DATA";

  const parsed = parsePendingChangeData(facultyEditDataSchema, data, id);
  if (!parsed) return "INVALID_DATA";

  if (!(await claim())) return "NOT_FOUND";
  await tx.faculty.update({
    where: { id: targetId },
    data: toFacultyUpdateInput(parsed),
  });
  return "APPLIED";
}

async function applyStudyProgram(ctx: ApplyContext): Promise<ApplyResult> {
  const { tx, id, data, targetId, parentId, typeOfChange, claim } = ctx;

  if (typeOfChange === "DELETE") {
    if (targetId === null) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.studyProgram.delete({ where: { id: targetId } });
    return "APPLIED";
  }

  if (typeOfChange === "CREATE") {
    if (parentId === null) return "INVALID_DATA";
    const parsed = parsePendingChangeData(
      studyProgramTreeDataSchema,
      data,
      id,
    );
    if (!parsed) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.studyProgram.create({
      data: toStudyProgramTreeCreateInput(parsed, parentId),
    });
    return "APPLIED";
  }

  if (targetId === null) return "INVALID_DATA";

  const parsed = parsePendingChangeData(
    studyProgramEditDataSchema,
    data,
    id,
  );
  if (!parsed) return "INVALID_DATA";

  if (!(await claim())) return "NOT_FOUND";
  await tx.studyProgram.update({
    where: { id: targetId },
    data: toStudyProgramUpdateInput(parsed),
  });
  return "APPLIED";
}

async function applyTrack(ctx: ApplyContext): Promise<ApplyResult> {
  const { tx, id, data, targetId, parentId, typeOfChange, claim } = ctx;

  if (typeOfChange === "DELETE") {
    if (targetId === null) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.track.delete({ where: { id: targetId } });
    return "APPLIED";
  }

  if (typeOfChange === "CREATE") {
    if (parentId === null) return "INVALID_DATA";
    const parsed = parsePendingChangeData(trackCreateDataSchema, data, id);
    if (!parsed) return "INVALID_DATA";
    if (!(await claim())) return "NOT_FOUND";
    await tx.track.create({
      data: toTrackCreateInput(parsed, parentId),
    });
    return "APPLIED";
  }

  if (targetId === null) return "INVALID_DATA";

  const parsed = parsePendingChangeData(trackEditDataSchema, data, id);
  if (!parsed) return "INVALID_DATA";

  if (!(await claim())) return "NOT_FOUND";
  await tx.track.update({
    where: { id: targetId },
    data: toTrackUpdateInput(parsed),
  });
  return "APPLIED";
}

const HANDLERS: Record<string, (ctx: ApplyContext) => Promise<ApplyResult>> = {
  UNIVERSITY: applyUniversity,
  FACULTY: applyFaculty,
  STUDY_PROGRAM: applyStudyProgram,
  TRACK: applyTrack,
};

async function applyPendingChange({
  id,
}: {
  id: string;
}): Promise<ApplyResult> {
  return prisma.$transaction(
    async (tx) => {
      const pendingChange = await tx.pendingChange.findUnique({
        where: { id },
      });

      if (!pendingChange) {
        return "NOT_FOUND";
      }

      const { targetType, typeOfChange, targetId, parentId } = pendingChange;

      const claim = async () => {
        const { count } = await tx.pendingChange.deleteMany({ where: { id } });
        return count > 0;
      };

      const handler = HANDLERS[targetType];
      if (!handler) return "INVALID_DATA";

      return handler({
        tx,
        id,
        data: pendingChange.data,
        targetId,
        parentId,
        typeOfChange,
        claim,
      });
    },
    { timeout: 20_000 },
  );
}

export { applyPendingChange };
export type { ApplyResult };
