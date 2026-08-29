import { prisma } from "../db/prisma.js";

import type { entityType } from "../generated/prisma/enums.js";

interface PendingChangeWithTarget {
  entityType: entityType;
  typeOfChange: string;
  targetId: number | null;
  parentId: number | null;
}

/**
 * For UPDATE/DELETE pending changes, batch-fetch the current entity data
 * from the corresponding table so the reviewer (admin or contributor)
 * can see what is being changed or removed.
 *
 * Also resolves the parent hierarchy context for non-UNIVERSITY entities
 * so reviewers can see where an entity sits in the academic tree
 * (e.g. "University of Sarajevo > Faculty of Law").
 *
 * Returns the same array with `currentEntity` and `parentContext`
 * attached to each item.
 */
async function enrichWithCurrentEntity<T extends PendingChangeWithTarget>(
  pendingChanges: T[],
) {
  const targetIds: Record<entityType, number[]> = {
    UNIVERSITY: [],
    FACULTY: [],
    STUDY_PROGRAM: [],
    SUBJECT: [],
    TRACK: [],
  };

  for (const pc of pendingChanges) {
    if (pc.targetId != null) {
      targetIds[pc.entityType].push(pc.targetId);
    }
  }

  const [universities, faculties, studyPrograms, subjects, tracks] =
    await Promise.all([
      targetIds.UNIVERSITY.length > 0
        ? prisma.university.findMany({
            where: { id: { in: targetIds.UNIVERSITY } },
            select: {
              id: true,
              name: true,
              city: true,
              entity: true,
              ownership: true,
              foundedYear: true,
              website: true,
              address: true,
              phone: true,
              email: true,
            },
          })
        : [],
      targetIds.FACULTY.length > 0
        ? prisma.faculty.findMany({
            where: { id: { in: targetIds.FACULTY } },
            select: {
              id: true,
              name: true,
              city: true,
              website: true,
              address: true,
              phone: true,
              email: true,
              university: { select: { name: true } },
            },
          })
        : [],
      targetIds.STUDY_PROGRAM.length > 0
        ? prisma.studyProgram.findMany({
            where: { id: { in: targetIds.STUDY_PROGRAM } },
            select: {
              id: true,
              name: true,
              cycle: true,
              durationYears: true,
              ects: true,
              language: true,
              faculty: {
                select: {
                  name: true,
                  university: { select: { name: true } },
                },
              },
            },
          })
        : [],
      targetIds.SUBJECT.length > 0
        ? prisma.subject.findMany({
            where: { id: { in: targetIds.SUBJECT } },
            select: {
              id: true,
              name: true,
              semester: true,
              ects: true,
              type: true,
              studyProgram: {
                select: {
                  name: true,
                  faculty: {
                    select: {
                      name: true,
                      university: { select: { name: true } },
                    },
                  },
                },
              },
            },
          })
        : [],
      targetIds.TRACK.length > 0
        ? prisma.track.findMany({
            where: { id: { in: targetIds.TRACK } },
            select: {
              id: true,
              name: true,
              ects: true,
              durationYears: true,
              studyProgram: {
                select: {
                  name: true,
                  faculty: {
                    select: {
                      name: true,
                      university: { select: { name: true } },
                    },
                  },
                },
              },
            },
          })
        : [],
    ]);

  // Build maps for currentEntity (strip relation fields from the response)
  const entityMaps: Record<entityType, Map<number, object>> = {
    UNIVERSITY: new Map(universities.map((e) => [e.id, e])),
    FACULTY: new Map(
      faculties.map((f) => [
        f.id,
        { id: f.id, name: f.name, city: f.city, website: f.website },
      ]),
    ),
    STUDY_PROGRAM: new Map(
      studyPrograms.map((sp) => [
        sp.id,
        {
          id: sp.id,
          name: sp.name,
          cycle: sp.cycle,
          durationYears: sp.durationYears,
          ects: sp.ects,
          language: sp.language,
        },
      ]),
    ),
    SUBJECT: new Map(
      subjects.map((s) => [
        s.id,
        {
          id: s.id,
          name: s.name,
          semester: s.semester,
          ects: s.ects,
          type: s.type,
        },
      ]),
    ),
    TRACK: new Map(
      tracks.map((tr) => [
        tr.id,
        {
          id: tr.id,
          name: tr.name,
          ects: tr.ects,
          durationYears: tr.durationYears,
        },
      ]),
    ),
  };

  // Build parent context strings for UPDATE/DELETE targets
  const parentContextMaps: Record<entityType, Map<number, string>> = {
    UNIVERSITY: new Map(),
    FACULTY: new Map(faculties.map((f) => [f.id, f.university.name])),
    STUDY_PROGRAM: new Map(
      studyPrograms.map((sp) => [
        sp.id,
        `${sp.faculty.university.name} › ${sp.faculty.name}`,
      ]),
    ),
    SUBJECT: new Map(
      subjects.map((s) => [
        s.id,
        `${s.studyProgram.faculty.university.name} › ${s.studyProgram.faculty.name} › ${s.studyProgram.name}`,
      ]),
    ),
    TRACK: new Map(
      tracks.map((tr) => [
        tr.id,
        `${tr.studyProgram.faculty.university.name} › ${tr.studyProgram.faculty.name} › ${tr.studyProgram.name}`,
      ]),
    ),
  };

  // For CREATE operations, resolve parentId to get parent context.
  // parentId points to the direct parent:
  //   FACULTY CREATE -> parentId = universityId
  //   STUDY_PROGRAM CREATE -> parentId = facultyId
  //   SUBJECT CREATE -> parentId = studyProgramId
  //   TRACK CREATE -> parentId = studyProgramId
  const createParentIds: Record<
    "UNIVERSITY" | "FACULTY" | "STUDY_PROGRAM",
    number[]
  > = {
    UNIVERSITY: [],
    FACULTY: [],
    STUDY_PROGRAM: [],
  };

  for (const pc of pendingChanges) {
    if (pc.typeOfChange === "CREATE" && pc.parentId != null) {
      if (pc.entityType === "FACULTY") {
        createParentIds.UNIVERSITY.push(pc.parentId);
      } else if (pc.entityType === "STUDY_PROGRAM") {
        createParentIds.FACULTY.push(pc.parentId);
      } else if (pc.entityType === "SUBJECT" || pc.entityType === "TRACK") {
        createParentIds.STUDY_PROGRAM.push(pc.parentId);
      }
    }
  }

  const [parentUniversities, parentFaculties, parentStudyPrograms] =
    await Promise.all([
      createParentIds.UNIVERSITY.length > 0
        ? prisma.university.findMany({
            where: { id: { in: createParentIds.UNIVERSITY } },
            select: { id: true, name: true },
          })
        : [],
      createParentIds.FACULTY.length > 0
        ? prisma.faculty.findMany({
            where: { id: { in: createParentIds.FACULTY } },
            select: {
              id: true,
              name: true,
              university: { select: { name: true } },
            },
          })
        : [],
      createParentIds.STUDY_PROGRAM.length > 0
        ? prisma.studyProgram.findMany({
            where: { id: { in: createParentIds.STUDY_PROGRAM } },
            select: {
              id: true,
              name: true,
              faculty: {
                select: {
                  name: true,
                  university: { select: { name: true } },
                },
              },
            },
          })
        : [],
    ]);

  const parentUniversityMap = new Map(
    parentUniversities.map((u) => [u.id, u.name]),
  );
  const parentFacultyMap = new Map(
    parentFaculties.map((f) => [f.id, `${f.university.name} › ${f.name}`]),
  );
  const parentStudyProgramMap = new Map(
    parentStudyPrograms.map((sp) => [
      sp.id,
      `${sp.faculty.university.name} › ${sp.faculty.name} › ${sp.name}`,
    ]),
  );

  function getCreateParentContext(pc: PendingChangeWithTarget): string | null {
    if (pc.parentId == null) return null;
    if (pc.entityType === "FACULTY")
      return parentUniversityMap.get(pc.parentId) ?? null;
    if (pc.entityType === "STUDY_PROGRAM")
      return parentFacultyMap.get(pc.parentId) ?? null;
    if (pc.entityType === "SUBJECT" || pc.entityType === "TRACK")
      return parentStudyProgramMap.get(pc.parentId) ?? null;
    return null;
  }

  return pendingChanges.map((pc) => ({
    ...pc,
    currentEntity:
      pc.targetId != null
        ? (entityMaps[pc.entityType].get(pc.targetId) ?? null)
        : null,
    parentContext:
      pc.entityType === "UNIVERSITY"
        ? null
        : pc.typeOfChange === "CREATE"
          ? getCreateParentContext(pc)
          : pc.targetId != null
            ? (parentContextMaps[pc.entityType].get(pc.targetId) ?? null)
            : null,
  }));
}

export { enrichWithCurrentEntity };
