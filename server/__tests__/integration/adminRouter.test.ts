import request from "supertest";
import { describe, test, expect } from "vitest";
import { app } from "../../src/app.js";
import { createAndLoginUser } from "../utils/createUserAndLogin.js";
import { createNewUserInput } from "../utils/createNewUserInput.js";
import { prisma } from "../../src/db/prisma.js";
import { logger } from "../../src/utils/logger.js";
import type { entityType } from "../../src/generated/prisma/enums.js";

function asUnknown(value: unknown): unknown {
  return value;
}

describe("Admin Router - GET /users/admin/pending-changes", () => {
  test("Responds with status 200 and all pending changes if role ADMIN", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: 1,
        parentId: null,
        data: {
          name: "Test Admin GET University",
          city: "Test City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent.get("/users/admin/pending-changes");
    expect(response.status).toBe(200);
    const responseBody = asUnknown(response.body);
    expect(responseBody).toEqual(
      expect.objectContaining({
        message: "Pending changes retrieved successfully.",
      }),
    );

    if (
      typeof responseBody !== "object" ||
      responseBody === null ||
      !("data" in responseBody) ||
      !Array.isArray(responseBody.data)
    ) {
      throw new Error("Expected pending changes response data to be an array");
    }

    expect(responseBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: pendingChange.id,
          user: {
            email: userInDb.email,
            role: userInDb.role,
          },
        }),
      ]),
    );

    await prisma.pendingChange.delete({ where: { id: pendingChange.id } });
    await prisma.user.delete({ where: { id: userInDb.id } });
  });
});

describe("Admin Router - DELETE /users/admin/decline-pending-change", () => {
  test("Responds with status 200 if role ADMIN", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: 1,
        parentId: null,
        data: {
          name: "Test Decline University",
          city: "Test City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .delete("/users/admin/decline-pending-change")
      .send({
        id: pendingChange.id,
      });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Pending change declined successfully.",
      }),
    );

    await prisma.user.delete({ where: { id: userInDb.id } });
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change", () => {
  test("Responds with status 404 if pending change does not exist", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: "a7d3c8f1-4b9e-4f2a-8c3e-5d7f1b9a2c6e",
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: { message: "Pending change not found." },
      }),
    );

    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 404 if stored pending change data is invalid for its entity type", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: null,
        data: {
          name: "Malformed University",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });

    expect(response.status).toBe(404);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingChangeId: pendingChange.id,
      }),
      "Pending change data failed validation during approval.",
    );

    await prisma.pendingChange.delete({ where: { id: pendingChange.id } });
    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 404 if stored pending change data is not a record", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: null,
        data: "invalid string data",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });

    expect(response.status).toBe(404);

    await prisma.pendingChange.delete({ where: { id: pendingChange.id } });
    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  const entityTypes: entityType[] = [
    "UNIVERSITY",
    "FACULTY",
    "STUDY_PROGRAM",
    "TRACK",
  ];

  test.each(entityTypes)(
    "Responds with status 404 if stored pending change target id is null for a DELETE change type for entity type %s",
    async (entityType) => {
      const userInput = createNewUserInput({ role: "ADMIN" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ["confirm-password"]: confirmPassword, ...userRequested } =
        userInput;

      const userInDb = await prisma.user.create({
        data: userRequested,
      });

      const pendingChange = await prisma.pendingChange.create({
        data: {
          entityType,
          typeOfChange: "DELETE",
          targetId: null,
          parentId: null,
          data: {},
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          reviewedAt: null,
          user: { connect: { id: userInDb.id } },
        },
      });

      const agent = request.agent(app);
      await createAndLoginUser(agent, { role: "ADMIN" });

      const response = await agent
        .post("/users/admin/approve-pending-change")
        .send({
          id: pendingChange.id,
        });

      expect(response.status).toBe(404);

      await prisma.pendingChange.delete({ where: { id: pendingChange.id } });
      await prisma.user.delete({ where: { id: userInDb.id } });
    },
  );

  test.each(entityTypes)(
    "Responds with status 404 if stored pending change target id is null for UPDATE change type for entity type %s",
    async (entityType) => {
      const userInput = createNewUserInput({ role: "ADMIN" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ["confirm-password"]: confirmPassword, ...userRequested } =
        userInput;

      const userInDb = await prisma.user.create({
        data: userRequested,
      });

      const pendingChange = await prisma.pendingChange.create({
        data: {
          entityType,
          typeOfChange: "UPDATE",
          targetId: null,
          parentId: null,
          data: {},
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          reviewedAt: null,
          user: { connect: { id: userInDb.id } },
        },
      });

      const agent = request.agent(app);
      await createAndLoginUser(agent, { role: "ADMIN" });

      const response = await agent
        .post("/users/admin/approve-pending-change")
        .send({
          id: pendingChange.id,
        });

      expect(response.status).toBe(404);

      await prisma.pendingChange.delete({ where: { id: pendingChange.id } });
      await prisma.user.delete({ where: { id: userInDb.id } });
    },
  );
  const enums = ["FACULTY", "STUDY_PROGRAM", "TRACK"] as const;
  test.each(enums)(
    "Responds with status 404 if stored pending change parent id is null for CREATE change type for entity type %s",
    async (entityType) => {
      const userInput = createNewUserInput({ role: "ADMIN" });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ["confirm-password"]: confirmPassword, ...userRequested } =
        userInput;

      const userInDb = await prisma.user.create({
        data: userRequested,
      });

      const pendingChange = await prisma.pendingChange.create({
        data: {
          entityType,
          typeOfChange: "CREATE",
          targetId: null,
          parentId: null,
          data: {},
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          reviewedAt: null,
          user: { connect: { id: userInDb.id } },
        },
      });

      const agent = request.agent(app);
      await createAndLoginUser(agent, { role: "ADMIN" });

      const response = await agent
        .post("/users/admin/approve-pending-change")
        .send({
          id: pendingChange.id,
        });

      expect(response.status).toBe(404);

      await prisma.pendingChange.delete({ where: { id: pendingChange.id } });
      await prisma.user.delete({ where: { id: userInDb.id } });
    },
  );
});

describe("Admin Router - POST /users/admin/approve-pending-change for UNIVERSITY", () => {
  test("Responds with status 200 and message if a pending change is approved successfully DELETE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test DELETE University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "UNIVERSITY",
        typeOfChange: "DELETE",
        targetId: university.id,
        parentId: null,

        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));

    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 200 and message if a pending change is approved successfully for CREATE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "UNIVERSITY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: null,
        data: {
          name: "Test Create University",
          city: "Test City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
    await prisma.university.deleteMany();

    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 200 and message if a pending change is approved successfully for UPDATE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test Update University",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "UNIVERSITY",
        typeOfChange: "UPDATE",
        targetId: university.id,
        parentId: null,
        data: {
          name: "Test Approve University Updated",
          city: "Test City Updated",
          entity: "RS",
          ownership: "PRIVATE",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
    await prisma.university.deleteMany();

    await prisma.user.delete({ where: { id: userInDb.id } });
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change for FACULTY", () => {
  test("Responds with status 200 and message if a pending change is approved successfully for CREATE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test University for CREATE",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "FACULTY",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: university.id,
        data: {
          name: "Test Create Faculty",
          city: "Test City",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));

    await prisma.faculty.deleteMany();
    await prisma.university.deleteMany();

    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 200 and message if a pending change is approved successfully for UPDATE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test University for UPDATE",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        name: "Test Update Faculty",
        city: "Test City",
        universityId: university.id,
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "FACULTY",
        typeOfChange: "UPDATE",
        targetId: faculty.id,
        parentId: university.id,
        data: {
          name: "Test Approve Faculty Updated",
          city: "Test City Updated",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));

    await prisma.faculty.deleteMany();
    await prisma.university.deleteMany();

    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 200 and message if a pending change is approved successfully for DELETE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test University for DELETE",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        name: "Test Delete Faculty",
        city: "Test City",
        universityId: university.id,
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "FACULTY",
        typeOfChange: "DELETE",
        targetId: faculty.id,
        parentId: university.id,
        data: {},
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));

    await prisma.faculty.deleteMany();
    await prisma.university.deleteMany();
    await prisma.user.delete({ where: { id: userInDb.id } });
  });
});

describe("Admin Router - POST /users/admin/approve-pending-change for STUDY_PROGRAM", () => {
  test("Responds with status 200 and message if a pending change is approved successfully DELETE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test University for DELETE",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        name: "Test Delete Faculty",
        city: "Test City",
        universityId: university.id,
      },
    });

    const studyProgram = await prisma.studyProgram.create({
      data: {
        name: "Test Delete Study Program",
        cycle: "FIRST",
        facultyId: faculty.id,
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "STUDY_PROGRAM",
        typeOfChange: "DELETE",
        targetId: studyProgram.id,
        parentId: faculty.id,
        data: {},
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));

    await prisma.studyProgram.deleteMany();
    await prisma.faculty.deleteMany();
    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 200 and message if a pending change is approved successfully for CREATE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test University for CREATE",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        name: "Test Create Faculty",
        city: "Test City",
        universityId: university.id,
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "STUDY_PROGRAM",
        typeOfChange: "CREATE",
        targetId: null,
        parentId: faculty.id,
        data: {
          name: "Test Create Study Program",
          cycle: "FIRST",
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));

    await prisma.studyProgram.deleteMany();
    await prisma.faculty.deleteMany();
    await prisma.user.delete({ where: { id: userInDb.id } });
  });

  test("Responds with status 200 and message if a pending change is approved successfully for UPDATE", async () => {
    const userInput = createNewUserInput({ role: "ADMIN" });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: confirmPassword, ...userRequested } =
      userInput;

    const userInDb = await prisma.user.create({
      data: userRequested,
    });

    const university = await prisma.university.create({
      data: {
        name: "Test University for UPDATE",
        city: "Test City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const faculty = await prisma.faculty.create({
      data: {
        name: "Test Update Faculty",
        city: "Test City",
        universityId: university.id,
      },
    });

    const studyProgram = await prisma.studyProgram.create({
      data: {
        name: "Test Update Study Program",
        cycle: "FIRST",
        facultyId: faculty.id,
      },
    });

    const pendingChange = await prisma.pendingChange.create({
      data: {
        entityType: "STUDY_PROGRAM",
        typeOfChange: "UPDATE",
        targetId: studyProgram.id,
        parentId: faculty.id,
        data: {
          name: "Test Approve Study Program Updated",
          cycle: "SECOND",
          durationYears: 4,
          ects: 240,
        },
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        reviewedAt: null,
        user: { connect: { id: userInDb.id } },
      },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-pending-change")
      .send({
        id: pendingChange.id,
      });
    const expectedResponse = {
      status: 200,
      body: {
        data: null,
        message: "Pending change approved successfully.",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));

    await prisma.studyProgram.deleteMany();
    await prisma.faculty.deleteMany();
    await prisma.university.deleteMany();
    await prisma.user.delete({ where: { id: userInDb.id } });
  });
});

describe("Admin Router - GET /users/admin/admin-requests", () => {
  test("Responds with status 200 and only users with an active request", async () => {
    const requestingInput = createNewUserInput();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: _cp1, ...requestingData } = requestingInput;
    const requestingUser = await prisma.user.create({
      data: { ...requestingData, adminRequestedAt: new Date() },
    });

    const silentInput = createNewUserInput();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: _cp2, ...silentData } = silentInput;
    const silentUser = await prisma.user.create({ data: silentData });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent.get("/users/admin/admin-requests");
    const responseBody = asUnknown(response.body);

    expect(response.status).toBe(200);
    expect(responseBody).toEqual(
      expect.objectContaining({
        message: "Admin requests retrieved successfully.",
      }),
    );

    if (
      typeof responseBody !== "object" ||
      responseBody === null ||
      !("data" in responseBody) ||
      !Array.isArray(responseBody.data)
    ) {
      throw new Error("Expected admin requests response data to be an array");
    }

    expect(responseBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: requestingUser.id,
          email: requestingUser.email,
        }),
      ]),
    );
    expect(
      responseBody.data.some(
        (adminRequest: unknown) =>
          typeof adminRequest === "object" &&
          adminRequest !== null &&
          "id" in adminRequest &&
          adminRequest.id === silentUser.id,
      ),
    ).toBe(false);

    await prisma.user.delete({ where: { id: requestingUser.id } });
    await prisma.user.delete({ where: { id: silentUser.id } });
  });

  test("Responds with status 403 if role is not ADMIN", async () => {
    const agent = request.agent(app);
    const userData = createNewUserInput();
    await createAndLoginUser(agent, userData);

    const response = await agent.get("/users/admin/admin-requests");

    expect(response.status).toBe(403);

    await prisma.user.delete({ where: { email: userData.email } });
  });
});

describe("Admin Router - POST /users/admin/approve-admin-request", () => {
  test("Responds with status 200, promotes the user, and clears the request", async () => {
    // The approve/decline endpoints validate the id as a UUID
    const requestingInput = createNewUserInput({ id: crypto.randomUUID() });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: _cp, ...requestingData } = requestingInput;
    const requestingUser = await prisma.user.create({
      data: { ...requestingData, adminRequestedAt: new Date() },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

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

    await prisma.user.delete({ where: { id: requestingUser.id } });
  });

  test("Responds with status 404 if the user has no active request", async () => {
    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-admin-request")
      .send({ id: "a7d3c8f1-4b9e-4f2a-8c3e-5d7f1b9a2c6e" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: { message: "Admin request not found." },
      }),
    );
  });

  test("Responds with status 400 for a malformed user id", async () => {
    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

    const response = await agent
      .post("/users/admin/approve-admin-request")
      .send({ id: "not-a-uuid" });

    expect(response.status).toBe(400);
  });
});

describe("Admin Router - DELETE /users/admin/decline-admin-request", () => {
  test("Responds with status 200, keeps the USER role, and clears the request", async () => {
    // The approve/decline endpoints validate the id as a UUID
    const requestingInput = createNewUserInput({ id: crypto.randomUUID() });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ["confirm-password"]: _cp, ...requestingData } = requestingInput;
    const requestingUser = await prisma.user.create({
      data: { ...requestingData, adminRequestedAt: new Date() },
    });

    const agent = request.agent(app);
    await createAndLoginUser(agent, { role: "ADMIN" });

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

    // Declining again is a 404 because the request is no longer active
    const repeatResponse = await agent
      .delete("/users/admin/decline-admin-request")
      .send({ id: requestingUser.id });
    expect(repeatResponse.status).toBe(404);

    await prisma.user.delete({ where: { id: requestingUser.id } });
  });
});
