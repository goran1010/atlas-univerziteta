import { prisma } from "../db/prisma.js";

import type { targetType } from "../generated/prisma/enums.js";

interface PendingChangeWithTarget {
  targetType: targetType;
  typeOfChange: string;
  targetId: number | null;
  parentId: number | null;
}

// One ancestor in the academic hierarchy, ordered top-down, so the UI can
// render linked breadcrumbs (universities and faculties have detail pages).
interface ParentCrumb {
  targetType: "UNIVERSITY" | "FACULTY" | "STUDY_PROGRAM";
  id: number;
  name: string;
}

// For UPDATE/DELETE pending changes, batch-fetch the current entity data
// from the corresponding table so the reviewer (admin or contributor) can
// see what is being changed or removed, and resolve the parent hierarchy
// so they can see where the entity sits in the academic tree.
async function enrichWithCurrentEntity<T extends PendingChangeWithTarget>(
  pendingChanges: T[],
) {
  const targetIds: Record<targetType, number[]> = {
    UNIVERSITY: [],
    FACULTY: [],
    STUDY_PROGRAM: [],
    TRACK: [],
  };

  for (const pc of pendingChanges) {
    if (pc.targetId != null) {
      targetIds[pc.targetType].push(pc.targetId);
    }
  }

  const [universities, faculties, studyPrograms, tracks] = await Promise.all([
    targetIds.UNIVERSITY.length > 0
      ? prisma.university.findMany({
          where: { id: { in: targetIds.UNIVERSITY } },
          select: {
            id: true,
            name: true,
            acronym: true,
            city: true,
            entity: true,
            ownership: true,
            foundedYear: true,
            website: true,
            address: true,
            phone: true,
            email: true,
            _count: { select: { faculties: true } },
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
            university: { select: { id: true, name: true } },
            _count: { select: { studyPrograms: true } },
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
                id: true,
                name: true,
                university: { select: { id: true, name: true } },
              },
            },
            _count: { select: { tracks: true } },
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
                id: true,
                name: true,
                faculty: {
                  select: {
                    id: true,
                    name: true,
                    university: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        })
      : [],
  ]);

  // Build maps for currentEntity (strip relation fields from the response,
  // flatten child counts so reviewers see what hangs off the entity)
  const entityMaps: Record<targetType, Map<number, object>> = {
    UNIVERSITY: new Map(
      universities.map((u) => [
        u.id,
        {
          id: u.id,
          name: u.name,
          acronym: u.acronym,
          city: u.city,
          entity: u.entity,
          ownership: u.ownership,
          foundedYear: u.foundedYear,
          website: u.website,
          address: u.address,
          phone: u.phone,
          email: u.email,
          facultyCount: u._count.faculties,
        },
      ]),
    ),
    FACULTY: new Map(
      faculties.map((f) => [
        f.id,
        {
          id: f.id,
          name: f.name,
          city: f.city,
          website: f.website,
          address: f.address,
          phone: f.phone,
          email: f.email,
          studyProgramCount: f._count.studyPrograms,
        },
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
          trackCount: sp._count.tracks,
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

  // Build parent breadcrumb trails for UPDATE/DELETE targets
  const parentContextMaps: Record<targetType, Map<number, ParentCrumb[]>> = {
    UNIVERSITY: new Map(),
    FACULTY: new Map(
      faculties.map((f) => [
        f.id,
        [
          {
            targetType: "UNIVERSITY" as const,
            id: f.university.id,
            name: f.university.name,
          },
        ],
      ]),
    ),
    STUDY_PROGRAM: new Map(
      studyPrograms.map((sp) => [
        sp.id,
        [
          {
            targetType: "UNIVERSITY" as const,
            id: sp.faculty.university.id,
            name: sp.faculty.university.name,
          },
          {
            targetType: "FACULTY" as const,
            id: sp.faculty.id,
            name: sp.faculty.name,
          },
        ],
      ]),
    ),
    TRACK: new Map(
      tracks.map((tr) => [
        tr.id,
        [
          {
            targetType: "UNIVERSITY" as const,
            id: tr.studyProgram.faculty.university.id,
            name: tr.studyProgram.faculty.university.name,
          },
          {
            targetType: "FACULTY" as const,
            id: tr.studyProgram.faculty.id,
            name: tr.studyProgram.faculty.name,
          },
          {
            targetType: "STUDY_PROGRAM" as const,
            id: tr.studyProgram.id,
            name: tr.studyProgram.name,
          },
        ],
      ]),
    ),
  };

  // For CREATE operations, resolve parentId to get parent context.
  // parentId points to the direct parent:
  //   FACULTY CREATE -> parentId = universityId
  //   STUDY_PROGRAM CREATE -> parentId = facultyId
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
      if (pc.targetType === "FACULTY") {
        createParentIds.UNIVERSITY.push(pc.parentId);
      } else if (pc.targetType === "STUDY_PROGRAM") {
        createParentIds.FACULTY.push(pc.parentId);
      } else if (pc.targetType === "TRACK") {
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
              university: { select: { id: true, name: true } },
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
                  id: true,
                  name: true,
                  university: { select: { id: true, name: true } },
                },
              },
            },
          })
        : [],
    ]);

  const parentUniversityMap = new Map<number, ParentCrumb[]>(
    parentUniversities.map((u) => [
      u.id,
      [{ targetType: "UNIVERSITY" as const, id: u.id, name: u.name }],
    ]),
  );
  const parentFacultyMap = new Map<number, ParentCrumb[]>(
    parentFaculties.map((f) => [
      f.id,
      [
        {
          targetType: "UNIVERSITY" as const,
          id: f.university.id,
          name: f.university.name,
        },
        { targetType: "FACULTY" as const, id: f.id, name: f.name },
      ],
    ]),
  );
  const parentStudyProgramMap = new Map<number, ParentCrumb[]>(
    parentStudyPrograms.map((sp) => [
      sp.id,
      [
        {
          targetType: "UNIVERSITY" as const,
          id: sp.faculty.university.id,
          name: sp.faculty.university.name,
        },
        {
          targetType: "FACULTY" as const,
          id: sp.faculty.id,
          name: sp.faculty.name,
        },
        { targetType: "STUDY_PROGRAM" as const, id: sp.id, name: sp.name },
      ],
    ]),
  );

  function getCreateParentContext(
    pc: PendingChangeWithTarget,
  ): ParentCrumb[] | null {
    if (pc.parentId == null) return null;
    if (pc.targetType === "FACULTY")
      return parentUniversityMap.get(pc.parentId) ?? null;
    if (pc.targetType === "STUDY_PROGRAM")
      return parentFacultyMap.get(pc.parentId) ?? null;
    if (pc.targetType === "TRACK")
      return parentStudyProgramMap.get(pc.parentId) ?? null;
    return null;
  }

  return pendingChanges.map((pc) => ({
    ...pc,
    currentEntity:
      pc.targetId != null
        ? (entityMaps[pc.targetType].get(pc.targetId) ?? null)
        : null,
    parentContext:
      pc.targetType === "UNIVERSITY"
        ? null
        : pc.typeOfChange === "CREATE"
          ? getCreateParentContext(pc)
          : pc.targetId != null
            ? (parentContextMaps[pc.targetType].get(pc.targetId) ?? null)
            : null,
  }));
}

export { enrichWithCurrentEntity };
