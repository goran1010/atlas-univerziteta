import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";
import {
  facultyCreateDataSchema,
  facultyEditDataSchema,
  studyProgramCreateDataSchema,
  studyProgramEditDataSchema,
  trackCreateDataSchema,
  trackEditDataSchema,
  universityCreateDataSchema,
  universityEditDataSchema,
} from "../validation/contributionValidation.js";

import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";
import type {
  FacultyCreateData,
  FacultyEditData,
  StudyProgramCreateData,
  StudyProgramEditData,
  TrackCreateData,
  TrackEditData,
  UniversityCreateData,
  UniversityEditData,
} from "../validation/contributionValidation.js";

function toUniversityCreateInput(
  data: UniversityCreateData,
): Prisma.UniversityCreateInput {
  return {
    name: data.name,
    city: data.city,
    entity: data.entity,
    ownership: data.ownership,
    ...(data.acronym !== undefined && { acronym: data.acronym }),
    ...(data.foundedYear !== undefined && { foundedYear: data.foundedYear }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
  };
}

function toUniversityUpdateInput(
  data: UniversityEditData,
): Prisma.UniversityUpdateInput {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.city !== undefined && { city: data.city }),
    ...(data.entity !== undefined && { entity: data.entity }),
    ...(data.ownership !== undefined && { ownership: data.ownership }),
    ...(data.acronym !== undefined && { acronym: data.acronym }),
    ...(data.foundedYear !== undefined && { foundedYear: data.foundedYear }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
  };
}

function toFacultyCreateInput(
  data: FacultyCreateData,
  universityId: number,
): Prisma.FacultyUncheckedCreateInput {
  return {
    name: data.name,
    universityId,
    ...(data.city !== undefined && { city: data.city }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
  };
}

function toFacultyUpdateInput(
  data: FacultyEditData,
): Prisma.FacultyUpdateInput {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.city !== undefined && { city: data.city }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.email !== undefined && { email: data.email }),
  };
}

function toStudyProgramCreateInput(
  data: StudyProgramCreateData,
  facultyId: number,
): Prisma.StudyProgramUncheckedCreateInput {
  return {
    name: data.name,
    cycle: data.cycle,
    facultyId,
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.language !== undefined && { language: data.language }),
  };
}

function toStudyProgramUpdateInput(
  data: StudyProgramEditData,
): Prisma.StudyProgramUpdateInput {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.cycle !== undefined && { cycle: data.cycle }),
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.language !== undefined && { language: data.language }),
  };
}

function toTrackCreateInput(
  data: TrackCreateData,
  studyProgramId: number,
): Prisma.TrackUncheckedCreateInput {
  return {
    name: data.name,
    studyProgramId,
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
  };
}

function toTrackUpdateInput(data: TrackEditData): Prisma.TrackUpdateInput {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.ects !== undefined && { ects: data.ects }),
    ...(data.durationYears !== undefined && {
      durationYears: data.durationYears,
    }),
  };
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

async function approvePendingChange({ id }: { id: string }): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const pendingChange = await tx.pendingChange.findUnique({
      where: { id },
    });

    if (!pendingChange) {
      return false;
    }

    const { entityType, typeOfChange, targetId, parentId } = pendingChange;

    const deletePendingChange = async () => {
      await tx.pendingChange.delete({ where: { id } });
      return true;
    };

    if (entityType === "UNIVERSITY") {
      if (typeOfChange === "DELETE") {
        if (targetId === null) return false;

        await tx.university.delete({ where: { id: targetId } });
        return deletePendingChange();
      }

      if (typeOfChange === "CREATE") {
        const data = parsePendingChangeData(
          universityCreateDataSchema,
          pendingChange.data,
          id,
        );
        if (!data) return false;

        await tx.university.create({
          data: toUniversityCreateInput(data),
        });
        return deletePendingChange();
      }

      if (targetId === null) return false;

      const data = parsePendingChangeData(
        universityEditDataSchema,
        pendingChange.data,
        id,
      );
      if (!data) return false;

      await tx.university.update({
        where: { id: targetId },
        data: toUniversityUpdateInput(data),
      });

      return deletePendingChange();
    }

    if (entityType === "FACULTY") {
      if (typeOfChange === "DELETE") {
        if (targetId === null) return false;

        await tx.faculty.delete({ where: { id: targetId } });
        return deletePendingChange();
      }

      if (typeOfChange === "CREATE") {
        if (parentId === null) return false;

        const data = parsePendingChangeData(
          facultyCreateDataSchema,
          pendingChange.data,
          id,
        );
        if (!data) return false;

        await tx.faculty.create({
          data: toFacultyCreateInput(data, parentId),
        });

        return deletePendingChange();
      }

      if (targetId === null) return false;

      const data = parsePendingChangeData(
        facultyEditDataSchema,
        pendingChange.data,
        id,
      );
      if (!data) return false;

      await tx.faculty.update({
        where: { id: targetId },
        data: toFacultyUpdateInput(data),
      });

      return deletePendingChange();
    }

    if (entityType === "STUDY_PROGRAM") {
      if (typeOfChange === "DELETE") {
        if (targetId === null) return false;

        await tx.studyProgram.delete({ where: { id: targetId } });
        return deletePendingChange();
      }

      if (typeOfChange === "CREATE") {
        if (parentId === null) return false;

        const data = parsePendingChangeData(
          studyProgramCreateDataSchema,
          pendingChange.data,
          id,
        );
        if (!data) return false;

        await tx.studyProgram.create({
          data: toStudyProgramCreateInput(data, parentId),
        });

        return deletePendingChange();
      }

      if (targetId === null) return false;

      const data = parsePendingChangeData(
        studyProgramEditDataSchema,
        pendingChange.data,
        id,
      );
      if (!data) return false;

      await tx.studyProgram.update({
        where: { id: targetId },
        data: toStudyProgramUpdateInput(data),
      });

      return deletePendingChange();
    }

    // entityType === "TRACK" is the only remaining case
    if (typeOfChange === "DELETE") {
      if (targetId === null) return false;

      await tx.track.delete({ where: { id: targetId } });
      return deletePendingChange();
    }

    if (typeOfChange === "CREATE") {
      if (parentId === null) return false;

      const data = parsePendingChangeData(
        trackCreateDataSchema,
        pendingChange.data,
        id,
      );
      if (!data) return false;

      await tx.track.create({
        data: toTrackCreateInput(data, parentId),
      });

      return deletePendingChange();
    }

    if (targetId === null) return false;

    const data = parsePendingChangeData(
      trackEditDataSchema,
      pendingChange.data,
      id,
    );
    if (!data) return false;

    await tx.track.update({
      where: { id: targetId },
      data: toTrackUpdateInput(data),
    });

    return deletePendingChange();
  });
}

export { approvePendingChange };
