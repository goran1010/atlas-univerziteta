import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../src/db/prisma.js";
import { enrichWithCurrentEntity } from "../../src/models/pendingChangeModel.js";

let universityId: number;
let facultyId: number;
let studyProgramId: number;
let trackId: number;

beforeAll(async () => {
  const university = await prisma.university.create({
    data: {
      name: "Test Enrich University",
      city: "Test City",
      entity: "FBIH",
      ownership: "PUBLIC",
      foundedYear: "1950",
      website: "https://enrich.example",
      faculties: {
        create: {
          name: "Test Enrich Faculty",
          city: "Test Faculty City",
          website: "https://enrich-faculty.example",
          studyPrograms: {
            create: {
              name: "Test Enrich Program",
              cycle: "FIRST",
              durationYears: 3,
              ects: 180,
              language: "Bosanski",
              tracks: {
                create: {
                  name: "Test Enrich Track",
                  ects: 60,
                  durationYears: 1,
                },
              },
            },
          },
        },
      },
    },
    include: {
      faculties: {
        include: { studyPrograms: { include: { tracks: true } } },
      },
    },
  });

  universityId = university.id;
  const faculty = university.faculties[0];
  if (!faculty?.studyPrograms[0]?.tracks[0]) {
    throw new Error("Expected the test fixture hierarchy to be created");
  }
  facultyId = faculty.id;
  studyProgramId = faculty.studyPrograms[0].id;
  trackId = faculty.studyPrograms[0].tracks[0].id;
});

afterAll(async () => {
  await prisma.track.deleteMany({
    where: { studyProgram: { faculty: { universityId } } },
  });
  await prisma.studyProgram.deleteMany({
    where: { faculty: { universityId } },
  });
  await prisma.faculty.deleteMany({ where: { universityId } });
  await prisma.university.delete({ where: { id: universityId } });
});

describe("enrichWithCurrentEntity", () => {
  test("returns an empty array for no pending changes", async () => {
    expect(await enrichWithCurrentEntity([])).toEqual([]);
  });

  test("attaches current entities and parent context across a mixed batch", async () => {
    const enriched = await enrichWithCurrentEntity([
      {
        entityType: "UNIVERSITY",
        typeOfChange: "UPDATE",
        targetId: universityId,
        parentId: null,
      },
      {
        entityType: "FACULTY",
        typeOfChange: "DELETE",
        targetId: facultyId,
        parentId: universityId,
      },
      {
        entityType: "STUDY_PROGRAM",
        typeOfChange: "UPDATE",
        targetId: studyProgramId,
        parentId: facultyId,
      },
      {
        entityType: "TRACK",
        typeOfChange: "DELETE",
        targetId: trackId,
        parentId: studyProgramId,
      },
    ]);

    const [universityChange, facultyChange, programChange, trackChange] =
      enriched;

    // UNIVERSITY: full selected fields, never a parent context
    expect(universityChange?.currentEntity).toEqual(
      expect.objectContaining({
        id: universityId,
        name: "Test Enrich University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
        foundedYear: "1950",
        website: "https://enrich.example",
      }),
    );
    expect(universityChange?.parentContext).toBeNull();

    // FACULTY: relation fields stripped from currentEntity
    expect(facultyChange?.currentEntity).toEqual({
      id: facultyId,
      name: "Test Enrich Faculty",
      city: "Test Faculty City",
      website: "https://enrich-faculty.example",
    });
    expect(facultyChange?.parentContext).toBe("Test Enrich University");

    expect(programChange?.currentEntity).toEqual({
      id: studyProgramId,
      name: "Test Enrich Program",
      cycle: "FIRST",
      durationYears: 3,
      ects: 180,
      language: "Bosanski",
    });
    expect(programChange?.parentContext).toBe(
      "Test Enrich University › Test Enrich Faculty",
    );

    expect(trackChange?.currentEntity).toEqual({
      id: trackId,
      name: "Test Enrich Track",
      ects: 60,
      durationYears: 1,
    });
    expect(trackChange?.parentContext).toBe(
      "Test Enrich University › Test Enrich Faculty › Test Enrich Program",
    );
  });

  test("preserves the original pending change fields on the result", async () => {
    const enriched = await enrichWithCurrentEntity([
      {
        entityType: "FACULTY" as const,
        typeOfChange: "DELETE",
        targetId: facultyId,
        parentId: universityId,
        extra: "passthrough",
      },
    ]);

    expect(enriched[0]).toEqual(
      expect.objectContaining({
        entityType: "FACULTY",
        typeOfChange: "DELETE",
        targetId: facultyId,
        parentId: universityId,
        extra: "passthrough",
      }),
    );
  });

  test("resolves parent context for CREATE changes from parentId", async () => {
    const enriched = await enrichWithCurrentEntity([
      {
        entityType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: null,
      },
      {
        entityType: "FACULTY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: universityId,
      },
      {
        entityType: "STUDY_PROGRAM",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: facultyId,
      },
      {
        entityType: "TRACK",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: studyProgramId,
      },
    ]);

    const [universityCreate, facultyCreate, programCreate, trackCreate] =
      enriched;

    expect(universityCreate?.currentEntity).toBeNull();
    expect(universityCreate?.parentContext).toBeNull();
    expect(facultyCreate?.currentEntity).toBeNull();
    expect(facultyCreate?.parentContext).toBe("Test Enrich University");
    expect(programCreate?.parentContext).toBe(
      "Test Enrich University › Test Enrich Faculty",
    );
    expect(trackCreate?.parentContext).toBe(
      "Test Enrich University › Test Enrich Faculty › Test Enrich Program",
    );
  });

  test("falls back to null when targets or parents no longer exist", async () => {
    const missingUniversity = await prisma.university.create({
      data: {
        name: "Test Enrich Missing",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });
    await prisma.university.delete({ where: { id: missingUniversity.id } });

    const enriched = await enrichWithCurrentEntity([
      {
        entityType: "UNIVERSITY",
        typeOfChange: "UPDATE",
        targetId: missingUniversity.id,
        parentId: null,
      },
      {
        entityType: "FACULTY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: missingUniversity.id,
      },
      {
        entityType: "FACULTY",
        typeOfChange: "UPDATE",
        targetId: null,
        parentId: null,
      },
    ]);

    const [missingTarget, missingParent, nullTarget] = enriched;

    expect(missingTarget?.currentEntity).toBeNull();
    expect(missingTarget?.parentContext).toBeNull();
    expect(missingParent?.currentEntity).toBeNull();
    expect(missingParent?.parentContext).toBeNull();
    expect(nullTarget?.currentEntity).toBeNull();
    expect(nullTarget?.parentContext).toBeNull();
  });
});
