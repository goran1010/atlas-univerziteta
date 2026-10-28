import request from "supertest";
import { describe, test, expect, beforeAll, afterEach, afterAll } from "vitest";
import { app } from "../../src/app.js";
import { createAndLoginUser } from "../utils/createUserAndLogin.js";
import { createDbUserData } from "../utils/createNewUserInput.js";
import { deleteUser } from "../utils/deleteUser.js";
import {
  getResponseObject,
  getResponseArray,
} from "../utils/responseHelpers.js";
import { prisma } from "../../src/db/prisma.js";
import { foldSearchText } from "../../src/search/fold.js";
import { logger } from "../../src/utils/logger.js";

import type { Agent, Response } from "supertest";
import type {
  targetType,
  typeOfChange,
} from "../../src/generated/prisma/enums.js";
import type { Prisma } from "../../src/generated/prisma/client.js";

const TEST_EMAIL_DOMAIN = "@non-existent-mail.comms";

let agent: Agent;
let admin: { id: string; email: string };

beforeAll(async () => {
  agent = request.agent(app);
  const loginResponse = await createAndLoginUser(agent, { role: "ADMIN" });
  expect(loginResponse.status).toBe(200);
  const loginResponseBody = getResponseObject(loginResponse.body);
  admin = getResponseObject(loginResponseBody["user"]) as {
    id: string;
    email: string;
  };
});

afterEach(async () => {
  await prisma.pendingChange.deleteMany();
  await prisma.track.deleteMany({ where: { name: { startsWith: "Test " } } });
  await prisma.studyProgram.deleteMany({
    where: { name: { startsWith: "Test " } },
  });
  await prisma.faculty.deleteMany({ where: { name: { startsWith: "Test " } } });
  await prisma.university.deleteMany({
    where: { name: { startsWith: "Test " } },
  });

  const leftoverUsers = await prisma.user.findMany({
    where: { email: { endsWith: TEST_EMAIL_DOMAIN }, id: { not: admin.id } },
  });
  for (const user of leftoverUsers) {
    await deleteUser(user.email);
  }
});

afterAll(async () => {
  await deleteUser(admin.email);
});

interface PendingChangeInput {
  targetType: targetType;
  typeOfChange: typeOfChange;
  targetId?: number | null;
  parentId?: number | null;
  data?: Prisma.InputJsonValue;
}

function createPendingChange({
  targetType,
  typeOfChange,
  targetId = null,
  parentId = null,
  data,
}: PendingChangeInput) {
  return prisma.pendingChange.create({
    data: {
      targetType,
      typeOfChange,
      targetId,
      parentId,
      ...(data === undefined ? {} : { data }),
      user: { connect: { id: admin.id } },
    },
  });
}

function createUniversity(name: string) {
  return prisma.university.create({
    data: { name, city: "Test City", entity: "FBIH", ownership: "PUBLIC" },
  });
}

function createFaculty(universityId: number, name: string) {
  return prisma.faculty.create({
    data: { name, city: "Test City", universityId },
  });
}

function createStudyProgram(facultyId: number, name: string) {
  return prisma.studyProgram.create({
    data: { name, cycle: "FIRST", facultyId },
  });
}

function createTrack(studyProgramId: number, name: string) {
  return prisma.track.create({
    data: { name, studyProgramId },
  });
}

function approve(id: string) {
  return agent.post("/users/admin/approve-pending-change").send({ id });
}

function expectApproved(response: Response) {
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    data: null,
    message: "Pending change approved successfully.",
  });
}

describe("Admin Router - GET /users/admin/pending-changes", () => {
  test("Responds with status 200 and all pending changes if role ADMIN", async () => {
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      targetId: 1,
      data: {
        name: "Test Admin GET University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const response = await agent.get("/users/admin/pending-changes");
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Pending changes retrieved successfully.",
    );
    const data = getResponseArray(responseBody["data"]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pendingChange.id,
          user: {
            email: admin.email,
            role: "ADMIN",
          },
        }),
      ]),
    );
  });
});

describe("Admin Router - DELETE /users/admin/decline-pending-change", () => {
  test("Responds with status 200 if role ADMIN", async () => {
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      targetId: 1,
      data: {
        name: "Test Decline University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const response = await agent
      .delete("/users/admin/decline-pending-change")
      .send({ id: pendingChange.id });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: null,
      message: "Pending change declined successfully.",
    });
    expect(
      await prisma.pendingChange.findUnique({
        where: { id: pendingChange.id },
      }),
    ).toBeNull();
  });

  test("Responds with status 404 if pending change does not exist", async () => {
    const response = await agent
      .delete("/users/admin/decline-pending-change")
      .send({ id: "a7d3c8f1-4b9e-4f2a-8c3e-5d7f1b9a2c6e" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Pending change not found." },
    });
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change", () => {
  test("Responds with status 404 if pending change does not exist", async () => {
    const response = await approve("a7d3c8f1-4b9e-4f2a-8c3e-5d7f1b9a2c6e");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message:
          "Pending change not found - it may have already been reviewed.",
      },
    });
  });

  test("Responds with status 422 if stored pending change data is invalid for its entity type", async () => {
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Malformed University",
      },
    });

    const response = await approve(pendingChange.id);

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_STORED_DATA",
        message:
          "The stored suggestion data is no longer valid and cannot be applied. Decline it instead.",
      },
    });
    expect(
      await prisma.pendingChange.findUnique({
        where: { id: pendingChange.id },
      }),
    ).not.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingChangeId: pendingChange.id,
      }),
      "Pending change data failed validation during approval.",
    );
  });

  test("Responds with status 422 if stored pending change data is not a record", async () => {
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: "invalid string data",
    });

    const response = await approve(pendingChange.id);

    expect(response.status).toBe(422);
  });

  test("a second approval of the same change answers 404", async () => {
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Test Twice-Approved University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    expectApproved(await approve(pendingChange.id));

    const second = await approve(pendingChange.id);
    expect(second.status).toBe(404);
    expect(second.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message:
          "Pending change not found - it may have already been reviewed.",
      },
    });
    expect(
      await prisma.university.count({
        where: { name: "Test Twice-Approved University" },
      }),
    ).toBe(1);
  });

  test("approving an UPDATE whose target was deleted answers 409 and keeps the row", async () => {
    const university = await createUniversity("Test Stale Update University");
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "UPDATE",
      targetId: university.id,
      data: { name: "Test Stale Update Renamed" },
    });
    await prisma.university.delete({ where: { id: university.id } });

    const response = await approve(pendingChange.id);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "The target of this change no longer exists.",
      },
    });
    expect(
      await prisma.pendingChange.findUnique({
        where: { id: pendingChange.id },
      }),
    ).not.toBeNull();
  });

  test("approving a DELETE whose target was deleted answers 409", async () => {
    const university = await createUniversity("Test Stale Delete University");
    const faculty = await createFaculty(university.id, "Test Stale Faculty");
    const pendingChange = await createPendingChange({
      targetType: "FACULTY",
      typeOfChange: "DELETE",
      targetId: faculty.id,
    });
    await prisma.faculty.delete({ where: { id: faculty.id } });

    const response = await approve(pendingChange.id);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "The target of this change no longer exists.",
      },
    });
  });

  test("approving a CREATE whose parent was deleted answers 409 and keeps the row", async () => {
    const university = await createUniversity("Test Gone Parent University");
    const pendingChange = await createPendingChange({
      targetType: "FACULTY",
      typeOfChange: "CREATE",
      parentId: university.id,
      data: { name: "Test Orphaned Faculty" },
    });
    await prisma.university.delete({ where: { id: university.id } });

    const response = await approve(pendingChange.id);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "The parent this new item belongs under no longer exists.",
      },
    });
    expect(
      await prisma.faculty.findFirst({
        where: { name: "Test Orphaned Faculty" },
      }),
    ).toBeNull();
    expect(
      await prisma.pendingChange.findUnique({
        where: { id: pendingChange.id },
      }),
    ).not.toBeNull();
  });

  const entityTypes: targetType[] = [
    "UNIVERSITY",
    "FACULTY",
    "STUDY_PROGRAM",
    "TRACK",
  ];

  test.each(entityTypes)(
    "Responds with status 422 if stored pending change target id is null for a DELETE change type for entity type %s",
    async (targetType) => {
      const pendingChange = await createPendingChange({
        targetType,
        typeOfChange: "DELETE",
        data: {},
      });

      const response = await approve(pendingChange.id);

      expect(response.status).toBe(422);
    },
  );

  test.each(entityTypes)(
    "Responds with status 422 if stored pending change target id is null for UPDATE change type for entity type %s",
    async (targetType) => {
      const pendingChange = await createPendingChange({
        targetType,
        typeOfChange: "UPDATE",
        data: {},
      });

      const response = await approve(pendingChange.id);

      expect(response.status).toBe(422);
    },
  );

  const childEntityTypes = ["FACULTY", "STUDY_PROGRAM", "TRACK"] as const;

  test.each(childEntityTypes)(
    "Responds with status 422 if stored pending change parent id is null for CREATE change type for entity type %s",
    async (targetType) => {
      const pendingChange = await createPendingChange({
        targetType,
        typeOfChange: "CREATE",
        data: {},
      });

      const response = await approve(pendingChange.id);

      expect(response.status).toBe(422);
    },
  );
});

describe("Admin Router - POST /users/admin/approve-pending-change for UNIVERSITY", () => {
  test("Responds with status 200 and message if a pending change is approved successfully DELETE", async () => {
    const university = await createUniversity("Test DELETE University");
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "DELETE",
      targetId: university.id,
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.university.findUnique({ where: { id: university.id } }),
    ).toBeNull();
  });

  test("DELETE cascades through faculties, study programs, and tracks", async () => {
    const university = await createUniversity("Test Cascade University");
    const faculty = await createFaculty(university.id, "Test Cascade Faculty");
    const studyProgram = await createStudyProgram(
      faculty.id,
      "Test Cascade Program",
    );
    const track = await createTrack(studyProgram.id, "Test Cascade Track");
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "DELETE",
      targetId: university.id,
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.university.findUnique({ where: { id: university.id } }),
    ).toBeNull();
    expect(
      await prisma.faculty.findUnique({ where: { id: faculty.id } }),
    ).toBeNull();
    expect(
      await prisma.studyProgram.findUnique({ where: { id: studyProgram.id } }),
    ).toBeNull();
    expect(
      await prisma.track.findUnique({ where: { id: track.id } }),
    ).toBeNull();
  });

  test("Responds with status 200 and message if a pending change is approved successfully for CREATE", async () => {
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Test Create University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    const created = await prisma.university.findFirst({
      where: { name: "Test Create University" },
    });
    expect(created).not.toBeNull();
  });

  test("Responds with status 200 and message if a pending change is approved successfully for UPDATE", async () => {
    const university = await createUniversity("Test Update University");
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "UPDATE",
      targetId: university.id,
      data: {
        name: "Test Approve University Updated",
        city: "Test City Updated",
        entity: "RS",
        ownership: "PRIVATE",
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.university.findUnique({ where: { id: university.id } }),
    ).toEqual(
      expect.objectContaining({
        name: "Test Approve University Updated",
        city: "Test City Updated",
        entity: "RS",
        ownership: "PRIVATE",
      }),
    );
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change for FACULTY", () => {
  test("Responds with status 200 and message if a pending change is approved successfully for CREATE", async () => {
    const university = await createUniversity("Test University for CREATE");
    const pendingChange = await createPendingChange({
      targetType: "FACULTY",
      typeOfChange: "CREATE",
      parentId: university.id,
      data: {
        name: "Test Create Faculty",
        city: "Test City",
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    const created = await prisma.faculty.findFirst({
      where: { name: "Test Create Faculty" },
    });
    expect(created?.universityId).toBe(university.id);
  });

  test("Responds with status 200 and message if a pending change is approved successfully for UPDATE", async () => {
    const university = await createUniversity("Test University for UPDATE");
    const faculty = await createFaculty(university.id, "Test Update Faculty");
    const pendingChange = await createPendingChange({
      targetType: "FACULTY",
      typeOfChange: "UPDATE",
      targetId: faculty.id,
      parentId: university.id,
      data: {
        name: "Test Approve Faculty Updated",
        city: "Test City Updated",
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.faculty.findUnique({ where: { id: faculty.id } }),
    ).toEqual(
      expect.objectContaining({
        name: "Test Approve Faculty Updated",
        city: "Test City Updated",
      }),
    );
  });

  test("Responds with status 200 and message if a pending change is approved successfully for DELETE", async () => {
    const university = await createUniversity("Test University for DELETE");
    const faculty = await createFaculty(university.id, "Test Delete Faculty");
    const pendingChange = await createPendingChange({
      targetType: "FACULTY",
      typeOfChange: "DELETE",
      targetId: faculty.id,
      parentId: university.id,
      data: {},
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.faculty.findUnique({ where: { id: faculty.id } }),
    ).toBeNull();
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change for STUDY_PROGRAM", () => {
  test("Responds with status 200 and message if a pending change is approved successfully DELETE", async () => {
    const university = await createUniversity("Test University for DELETE");
    const faculty = await createFaculty(university.id, "Test Delete Faculty");
    const studyProgram = await createStudyProgram(
      faculty.id,
      "Test Delete Study Program",
    );
    const pendingChange = await createPendingChange({
      targetType: "STUDY_PROGRAM",
      typeOfChange: "DELETE",
      targetId: studyProgram.id,
      parentId: faculty.id,
      data: {},
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.studyProgram.findUnique({ where: { id: studyProgram.id } }),
    ).toBeNull();
  });

  test("Responds with status 200 and message if a pending change is approved successfully for CREATE", async () => {
    const university = await createUniversity("Test University for CREATE");
    const faculty = await createFaculty(university.id, "Test Create Faculty");
    const pendingChange = await createPendingChange({
      targetType: "STUDY_PROGRAM",
      typeOfChange: "CREATE",
      parentId: faculty.id,
      data: {
        name: "Test Create Study Program",
        cycle: "FIRST",
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    const created = await prisma.studyProgram.findFirst({
      where: { name: "Test Create Study Program" },
    });
    expect(created?.facultyId).toBe(faculty.id);
  });

  test("Responds with status 200 and message if a pending change is approved successfully for UPDATE", async () => {
    const university = await createUniversity("Test University for UPDATE");
    const faculty = await createFaculty(university.id, "Test Update Faculty");
    const studyProgram = await createStudyProgram(
      faculty.id,
      "Test Update Study Program",
    );
    const pendingChange = await createPendingChange({
      targetType: "STUDY_PROGRAM",
      typeOfChange: "UPDATE",
      targetId: studyProgram.id,
      parentId: faculty.id,
      data: {
        name: "Test Approve Study Program Updated",
        cycle: "SECOND",
        durationYears: 4,
        ects: 240,
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.studyProgram.findUnique({ where: { id: studyProgram.id } }),
    ).toEqual(
      expect.objectContaining({
        name: "Test Approve Study Program Updated",
        cycle: "SECOND",
        durationYears: 4,
        ects: 240,
      }),
    );
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change for TRACK", () => {
  test("Responds with status 200 and message if a pending change is approved successfully for DELETE", async () => {
    const university = await createUniversity("Test University for DELETE");
    const faculty = await createFaculty(university.id, "Test Delete Faculty");
    const studyProgram = await createStudyProgram(
      faculty.id,
      "Test Delete Study Program",
    );
    const track = await createTrack(studyProgram.id, "Test Delete Track");
    const pendingChange = await createPendingChange({
      targetType: "TRACK",
      typeOfChange: "DELETE",
      targetId: track.id,
      parentId: studyProgram.id,
      data: {},
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(
      await prisma.track.findUnique({ where: { id: track.id } }),
    ).toBeNull();
  });

  test("Responds with status 200 and message if a pending change is approved successfully for CREATE", async () => {
    const university = await createUniversity("Test University for CREATE");
    const faculty = await createFaculty(university.id, "Test Create Faculty");
    const studyProgram = await createStudyProgram(
      faculty.id,
      "Test Create Study Program",
    );
    const pendingChange = await createPendingChange({
      targetType: "TRACK",
      typeOfChange: "CREATE",
      parentId: studyProgram.id,
      data: {
        name: "Test Create Track",
        ects: 60,
        durationYears: 1,
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    const created = await prisma.track.findFirst({
      where: { name: "Test Create Track" },
    });
    expect(created).toEqual(
      expect.objectContaining({
        studyProgramId: studyProgram.id,
        ects: 60,
        durationYears: 1,
      }),
    );
  });

  test("Responds with status 200 and message if a pending change is approved successfully for UPDATE", async () => {
    const university = await createUniversity("Test University for UPDATE");
    const faculty = await createFaculty(university.id, "Test Update Faculty");
    const studyProgram = await createStudyProgram(
      faculty.id,
      "Test Update Study Program",
    );
    const track = await createTrack(studyProgram.id, "Test Update Track");
    const pendingChange = await createPendingChange({
      targetType: "TRACK",
      typeOfChange: "UPDATE",
      targetId: track.id,
      parentId: studyProgram.id,
      data: {
        name: "Test Approve Track Updated",
        ects: 90,
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);
    expect(await prisma.track.findUnique({ where: { id: track.id } })).toEqual(
      expect.objectContaining({
        name: "Test Approve Track Updated",
        ects: 90,
      }),
    );
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change for trees", () => {
  test("approving a university tree creates every node with parents and search fields", async () => {
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Test Tree University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [
          {
            name: "Test Tree Faculty",
            city: "Test City",
            studyPrograms: [
              {
                name: "Test Tree Program",
                cycle: "FIRST",
                ects: 180,
                tracks: [{ name: "Test Tree Track", ects: 180 }],
              },
            ],
          },
          { name: "Test Tree Faculty Two" },
        ],
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);

    // the client omits the folded search* columns by default; opt back in
    // to check the tree create folded every level
    const university = await prisma.university.findUnique({
      where: { name: "Test Tree University" },
      omit: { searchName: false },
      include: {
        faculties: {
          orderBy: { name: "asc" },
          omit: { searchName: false },
          include: {
            studyPrograms: {
              omit: { searchName: false },
              include: { tracks: { omit: { searchName: false } } },
            },
          },
        },
      },
    });

    expect(university?.searchName).toBe(foldSearchText("Test Tree University"));
    expect(university?.faculties).toHaveLength(2);

    const [facultyOne, facultyTwo] = university?.faculties ?? [];
    expect(facultyOne?.name).toBe("Test Tree Faculty");
    expect(facultyOne?.searchName).toBe(foldSearchText("Test Tree Faculty"));
    expect(facultyTwo?.name).toBe("Test Tree Faculty Two");
    expect(facultyTwo?.studyPrograms).toHaveLength(0);

    const program = facultyOne?.studyPrograms[0];
    expect(program).toEqual(
      expect.objectContaining({
        name: "Test Tree Program",
        cycle: "FIRST",
        ects: 180,
        searchName: foldSearchText("Test Tree Program"),
      }),
    );
    expect(program?.tracks).toHaveLength(1);
    expect(program?.tracks[0]).toEqual(
      expect.objectContaining({
        name: "Test Tree Track",
        ects: 180,
        searchName: foldSearchText("Test Tree Track"),
      }),
    );

    expect(
      await prisma.pendingChange.findUnique({
        where: { id: pendingChange.id },
      }),
    ).toBeNull();
  });

  test("approving a faculty subtree creates it under the parent university", async () => {
    const university = await createUniversity("Test Subtree Parent");
    const pendingChange = await createPendingChange({
      targetType: "FACULTY",
      typeOfChange: "CREATE",
      parentId: university.id,
      data: {
        name: "Test Subtree Faculty",
        studyPrograms: [
          {
            name: "Test Subtree Program",
            cycle: "FIRST",
            tracks: [{ name: "Test Subtree Track" }],
          },
        ],
      },
    });

    const response = await approve(pendingChange.id);

    expectApproved(response);

    const faculty = await prisma.faculty.findFirst({
      where: { name: "Test Subtree Faculty" },
      include: { studyPrograms: { include: { tracks: true } } },
    });
    expect(faculty?.universityId).toBe(university.id);
    expect(faculty?.studyPrograms[0]?.tracks[0]?.name).toBe(
      "Test Subtree Track",
    );
  });

  test("a conflicting tree approval answers 409, creates nothing, and keeps the pending change", async () => {
    await createUniversity("Test Collision University");
    const pendingChange = await createPendingChange({
      targetType: "UNIVERSITY",
      typeOfChange: "CREATE",
      data: {
        name: "Test Collision University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [{ name: "Test Collision Faculty" }],
      },
    });

    const response = await approve(pendingChange.id);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "A university with this name already exists.",
      },
    });
    expect(
      await prisma.faculty.findFirst({
        where: { name: "Test Collision Faculty" },
      }),
    ).toBeNull();
    expect(
      await prisma.pendingChange.findUnique({
        where: { id: pendingChange.id },
      }),
    ).not.toBeNull();
  });

  test("a faculty name collision names the faculty constraint in the 409", async () => {
    const university = await createUniversity("Test Faculty Conflict Uni");
    await createFaculty(university.id, "Test Existing Faculty");

    const pendingChange = await createPendingChange({
      targetType: "FACULTY",
      typeOfChange: "CREATE",
      parentId: university.id,
      data: {
        name: "Test Existing Faculty",
        studyPrograms: [{ name: "Test Conflict Program", cycle: "FIRST" }],
      },
    });

    const response = await approve(pendingChange.id);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: {
        code: "CONFLICT",
        message: "A faculty with this name already exists in that university.",
      },
    });
    expect(
      await prisma.studyProgram.findFirst({
        where: { name: "Test Conflict Program" },
      }),
    ).toBeNull();
  });
});

describe("Admin Router - GET /users/admin/admin-requests", () => {
  test("Responds with status 200 and only users with an active request", async () => {
    const requestingUser = await prisma.user.create({
      data: {
        ...createDbUserData(),
        adminRequestedAt: new Date(),
        adminRequestReason: "I maintain my university's data",
      },
    });
    const silentUser = await prisma.user.create({ data: createDbUserData() });

    const response = await agent.get("/users/admin/admin-requests");
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Admin requests retrieved successfully.",
    );
    const data = getResponseArray(responseBody["data"]);
    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: requestingUser.id,
          email: requestingUser.email,
          adminRequestReason: "I maintain my university's data",
        }),
      ]),
    );
    expect(
      data.some((adminRequest) => adminRequest["id"] === silentUser.id),
    ).toBe(false);
  });

  test("Responds with status 403 if role is not ADMIN", async () => {
    const userAgent = request.agent(app);
    await createAndLoginUser(userAgent, {});

    const response = await userAgent.get("/users/admin/admin-requests");

    expect(response.status).toBe(403);
  });
});

describe("Admin Router - POST /users/admin/approve-admin-request", () => {
  test("Responds with status 200, promotes the user, and clears the request", async () => {
    const requestingUser = await prisma.user.create({
      data: {
        ...createDbUserData(),
        adminRequestedAt: new Date(),
        adminRequestReason: "Promote me",
      },
    });

    const response = await agent
      .post("/users/admin/approve-admin-request")
      .send({ id: requestingUser.id });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Admin request approved successfully.",
      }),
    );

    const userInDb = await prisma.user.findUnique({
      where: { id: requestingUser.id },
    });
    expect(userInDb?.role).toBe("ADMIN");
    expect(userInDb?.adminRequestedAt).toBeNull();
    expect(userInDb?.adminRequestReason).toBeNull();
  });

  test("Responds with status 404 if the user has no active request", async () => {
    const response = await agent
      .post("/users/admin/approve-admin-request")
      .send({ id: "nonexistent_user_id" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Admin request not found." },
    });
  });

  test("Responds with status 400 for an empty user id", async () => {
    const response = await agent
      .post("/users/admin/approve-admin-request")
      .send({ id: "" });

    expect(response.status).toBe(400);
  });
});

describe("Admin Router - DELETE /users/admin/decline-admin-request", () => {
  test("Responds with status 200, keeps the USER role, and clears the request", async () => {
    const requestingUser = await prisma.user.create({
      data: {
        ...createDbUserData(),
        adminRequestedAt: new Date(),
        adminRequestReason: "Decline me",
      },
    });

    const response = await agent
      .delete("/users/admin/decline-admin-request")
      .send({ id: requestingUser.id });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Admin request declined successfully.",
      }),
    );

    const userInDb = await prisma.user.findUnique({
      where: { id: requestingUser.id },
    });
    expect(userInDb?.role).toBe("USER");
    expect(userInDb?.adminRequestedAt).toBeNull();
    expect(userInDb?.adminRequestReason).toBeNull();

    // Declining again is a 404 because the request is no longer active
    const repeatResponse = await agent
      .delete("/users/admin/decline-admin-request")
      .send({ id: requestingUser.id });
    expect(repeatResponse.status).toBe(404);
  });
});
