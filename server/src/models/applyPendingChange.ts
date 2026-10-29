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

// INVALID_DATA keeps the row in the queue so the admin can decline it
type ApplyResult = "APPLIED" | "NOT_FOUND" | "INVALID_DATA";

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

async function applyPendingChange({
  id,
}: {
  id: string;
}): Promise<ApplyResult> {
  // a whole-university tree is up to 800 nested inserts, more than Prisma's
  // 5s default transaction budget allows on a slow disk
  return prisma.$transaction(
    async (tx) => {
      const pendingChange = await tx.pendingChange.findUnique({
        where: { id },
      });

      if (!pendingChange) {
        return "NOT_FOUND";
      }

      const { targetType, typeOfChange, targetId, parentId } = pendingChange;

      // Of two concurrent approvals, the second blocks on this delete and
      // finds the row gone; a failure after the claim rolls it back.
      const claim = async () => {
        const { count } = await tx.pendingChange.deleteMany({ where: { id } });
        return count > 0;
      };

      if (targetType === "UNIVERSITY") {
        if (typeOfChange === "DELETE") {
          if (targetId === null) return "INVALID_DATA";

          if (!(await claim())) return "NOT_FOUND";
          await tx.university.delete({ where: { id: targetId } });
          return "APPLIED";
        }

        if (typeOfChange === "CREATE") {
          const data = parsePendingChangeData(
            universityTreeDataSchema,
            pendingChange.data,
            id,
          );
          if (!data) return "INVALID_DATA";

          if (!(await claim())) return "NOT_FOUND";
          // one nested create, so the whole tree lands or nothing does
          await tx.university.create({
            data: toUniversityTreeCreateInput(data),
          });
          return "APPLIED";
        }

        if (targetId === null) return "INVALID_DATA";

        const data = parsePendingChangeData(
          universityEditDataSchema,
          pendingChange.data,
          id,
        );
        if (!data) return "INVALID_DATA";

        const current = await tx.university.findUnique({
          where: { id: targetId },
          select: { country: true, entity: true },
        });

        if (current) {
          const mergedCountry = data.country ?? current.country;
          const mergedEntity =
            data.entity !== undefined ? data.entity : current.entity;
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
          data: toUniversityUpdateInput(data),
        });
        return "APPLIED";
      }

      if (targetType === "FACULTY") {
        if (typeOfChange === "DELETE") {
          if (targetId === null) return "INVALID_DATA";

          if (!(await claim())) return "NOT_FOUND";
          await tx.faculty.delete({ where: { id: targetId } });
          return "APPLIED";
        }

        if (typeOfChange === "CREATE") {
          if (parentId === null) return "INVALID_DATA";

          const data = parsePendingChangeData(
            facultyTreeDataSchema,
            pendingChange.data,
            id,
          );
          if (!data) return "INVALID_DATA";

          if (!(await claim())) return "NOT_FOUND";
          await tx.faculty.create({
            data: toFacultyTreeCreateInput(data, parentId),
          });
          return "APPLIED";
        }

        if (targetId === null) return "INVALID_DATA";

        const data = parsePendingChangeData(
          facultyEditDataSchema,
          pendingChange.data,
          id,
        );
        if (!data) return "INVALID_DATA";

        if (!(await claim())) return "NOT_FOUND";
        await tx.faculty.update({
          where: { id: targetId },
          data: toFacultyUpdateInput(data),
        });
        return "APPLIED";
      }

      if (targetType === "STUDY_PROGRAM") {
        if (typeOfChange === "DELETE") {
          if (targetId === null) return "INVALID_DATA";

          if (!(await claim())) return "NOT_FOUND";
          await tx.studyProgram.delete({ where: { id: targetId } });
          return "APPLIED";
        }

        if (typeOfChange === "CREATE") {
          if (parentId === null) return "INVALID_DATA";

          const data = parsePendingChangeData(
            studyProgramTreeDataSchema,
            pendingChange.data,
            id,
          );
          if (!data) return "INVALID_DATA";

          if (!(await claim())) return "NOT_FOUND";
          await tx.studyProgram.create({
            data: toStudyProgramTreeCreateInput(data, parentId),
          });
          return "APPLIED";
        }

        if (targetId === null) return "INVALID_DATA";

        const data = parsePendingChangeData(
          studyProgramEditDataSchema,
          pendingChange.data,
          id,
        );
        if (!data) return "INVALID_DATA";

        if (!(await claim())) return "NOT_FOUND";
        await tx.studyProgram.update({
          where: { id: targetId },
          data: toStudyProgramUpdateInput(data),
        });
        return "APPLIED";
      }

      if (typeOfChange === "DELETE") {
        if (targetId === null) return "INVALID_DATA";

        if (!(await claim())) return "NOT_FOUND";
        await tx.track.delete({ where: { id: targetId } });
        return "APPLIED";
      }

      if (typeOfChange === "CREATE") {
        if (parentId === null) return "INVALID_DATA";

        const data = parsePendingChangeData(
          trackCreateDataSchema,
          pendingChange.data,
          id,
        );
        if (!data) return "INVALID_DATA";

        if (!(await claim())) return "NOT_FOUND";
        await tx.track.create({
          data: toTrackCreateInput(data, parentId),
        });
        return "APPLIED";
      }

      if (targetId === null) return "INVALID_DATA";

      const data = parsePendingChangeData(
        trackEditDataSchema,
        pendingChange.data,
        id,
      );
      if (!data) return "INVALID_DATA";

      if (!(await claim())) return "NOT_FOUND";
      await tx.track.update({
        where: { id: targetId },
        data: toTrackUpdateInput(data),
      });
      return "APPLIED";
    },
    { timeout: 20_000 },
  );
}

export { applyPendingChange };
export type { ApplyResult };
