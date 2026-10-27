import request from "supertest";
import { describe, test, expect } from "vitest";

import { app } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { prisma } from "../../src/db/prisma.js";
import { createAndLoginUser } from "../utils/createUserAndLogin.js";
import { getResponseObject } from "../utils/responseHelpers.js";

function expectValidationIssue(
  error: Record<string, unknown>,
  issue: { path: string; code: string },
) {
  expect(error["code"]).toBe("VALIDATION_ERROR");
  expect(error["message"]).toBe("Request validation failed.");
  expect(error["issues"]).toEqual(
    expect.arrayContaining([expect.objectContaining(issue)]),
  );
}

async function createLoggedInAgent() {
  const agent = request.agent(app);
  const loginResponse = await createAndLoginUser(agent, {});

  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body).toHaveProperty("token");

  const loginResponseBody = getResponseObject(loginResponse.body as unknown);
  const user = getResponseObject(loginResponseBody["user"]) as {
    id: string;
    email: string;
  };
  return { agent, user };
}

let entitySequence = 0;

async function createUniversity() {
  entitySequence++;

  return prisma.university.create({
    data: {
      name: `Test University ${entitySequence.toString()}`,
      city: "Test City",
      entity: "FBIH",
      ownership: "PUBLIC",
    },
  });
}

async function createFaculty() {
  const university = await createUniversity();
  entitySequence++;

  return prisma.faculty.create({
    data: {
      name: `Test Faculty ${entitySequence.toString()}`,
      universityId: university.id,
    },
  });
}

async function createStudyProgram() {
  const faculty = await createFaculty();
  entitySequence++;

  return prisma.studyProgram.create({
    data: {
      name: `Test Study Program ${entitySequence.toString()}`,
      cycle: "FIRST",
      facultyId: faculty.id,
    },
  });
}

describe("Contribution Router - POST /users/contribution/universities", () => {
  test("responds with status 401 when not logged in", async () => {
    const response = await request(app).post(
      "/users/contribution/universities",
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("responds with status 400 when targetType is missing", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities");
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "request", code: "invalid_type" });
  });

  test("responds with status 400 for unsupported data fields", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "TestCity University",
        city: "TestCity",
        entity: "FBIH",
        ownership: "PUBLIC",
        ects: 240,
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "data", code: "unrecognized_keys" });
  });

  test("responds with status 400 when the payload tries to set dataSourceUrl", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Provenance University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        dataSourceUrl: "https://example.com/source",
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "data", code: "unrecognized_keys" });
  });

  test("responds with status 400 when the website is not http(s)", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "TestCity University",
        city: "TestCity",
        entity: "FBIH",
        ownership: "PUBLIC",
        website: "javascript:alert(1)",
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, {
      path: "data.website",
      code: "invalid_format",
    });
  });

  test("responds with status 400 when a field exceeds its max length", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "a".repeat(201),
        city: "TestCity",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "data.name", code: "too_big" });
  });

  test("stores an optional contributor comment on all three routes", async () => {
    const { agent, user } = await createLoggedInAgent();
    const university = await createUniversity();

    const create = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Commented University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
      comment: "Found on the official site",
    });
    const edit = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: university.id,
      data: { name: "Commented Rename" },
      comment: "Name changed after merger",
    });
    const remove = await agent.delete("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: university.id,
      comment: "University closed in 2024",
    });

    expect(create.status).toBe(201);
    expect(edit.status).toBe(201);
    expect(remove.status).toBe(201);

    const stored = await prisma.pendingChange.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { comment: true },
    });
    expect(stored.map((change) => change.comment)).toEqual([
      "Found on the official site",
      "Name changed after merger",
      "University closed in 2024",
    ]);
  });

  test("stores no comment when none is sent", async () => {
    const { agent, user } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Uncommented University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    expect(response.status).toBe(201);
    const stored = await prisma.pendingChange.findFirst({
      where: { userId: user.id },
    });
    expect(stored?.comment).toBeNull();
  });

  test("responds with status 400 when the comment exceeds its max length", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Long Comment University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
      comment: "a".repeat(1001),
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "comment", code: "too_big" });
  });

  test("responds with status 201 and stores a create suggestion", async () => {
    const { agent, user } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "TestCity University",
        city: "TestCity",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Suggestion submitted. An admin will review it.",
      }),
    );

    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const pendingChangeId = data["id"] as string;
    const pendingChange = await prisma.pendingChange.findUnique({
      where: { id: pendingChangeId },
    });

    expect(pendingChange).toEqual(
      expect.objectContaining({
        userId: user.id,
        targetType: "UNIVERSITY",
        typeOfChange: "CREATE",
        parentId: null,
        targetId: null,
        data: {
          name: "TestCity University",
          city: "TestCity",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
      }),
    );
  });

  test("responds with status 404 when a child create parent does not exist", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "FACULTY",
      parentId: 999999,
      data: { name: "Faculty without university" },
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Parent entity not found." },
    });
  });

  test("responds with status 201 when a child create parent exists", async () => {
    const { agent } = await createLoggedInAgent();
    const university = await createUniversity();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "FACULTY",
      parentId: university.id,
      data: { name: "Faculty with university" },
    });

    expect(response.status).toBe(201);
  });

  test("responds with status 201 and stores a study program suggestion under a faculty", async () => {
    const { agent } = await createLoggedInAgent();
    const faculty = await createFaculty();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "STUDY_PROGRAM",
      parentId: faculty.id,
      data: { name: "Suggested Study Program", cycle: "FIRST" },
    });

    expect(response.status).toBe(201);
  });

  test("responds with status 201 and stores a track suggestion under a study program", async () => {
    const { agent, user } = await createLoggedInAgent();
    const studyProgram = await createStudyProgram();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "TRACK",
      parentId: studyProgram.id,
      data: { name: "Suggested Track", ects: 60 },
    });

    expect(response.status).toBe(201);
    const stored = await prisma.pendingChange.findFirst({
      where: { userId: user.id, targetType: "TRACK" },
    });
    expect(stored?.parentId).toBe(studyProgram.id);
    expect(stored?.typeOfChange).toBe("CREATE");
  });

  test("responds with status 429 on every route once the open-change cap is reached", async () => {
    const { agent, user } = await createLoggedInAgent();
    const university = await createUniversity();
    await prisma.pendingChange.createMany({
      data: Array.from({ length: 20 }, (_, i) => ({
        targetType: "UNIVERSITY" as const,
        typeOfChange: "CREATE" as const,
        data: {
          name: `Capped University ${i.toString()}`,
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        userId: user.id,
      })),
    });

    const expectLimited = (response: { status: number; body: unknown }) => {
      expect(response.status).toBe(429);
      const error = getResponseObject(
        getResponseObject(response.body)["error"],
      );
      expect(error["code"]).toBe("CONTRIBUTION_LIMIT");
    };

    expectLimited(
      await agent.post("/users/contribution/universities").send({
        targetType: "UNIVERSITY",
        data: {
          name: "One Too Many",
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
      }),
    );
    expectLimited(
      await agent.put("/users/contribution/universities").send({
        targetType: "UNIVERSITY",
        targetId: university.id,
        data: { name: "One Too Many" },
      }),
    );
    expectLimited(
      await agent.delete("/users/contribution/universities").send({
        targetType: "UNIVERSITY",
        targetId: university.id,
      }),
    );
  });

  test("responds with status 201 one change below the open-change cap", async () => {
    const { agent, user } = await createLoggedInAgent();
    await prisma.pendingChange.createMany({
      data: Array.from({ length: 19 }, (_, i) => ({
        targetType: "UNIVERSITY" as const,
        typeOfChange: "CREATE" as const,
        data: {
          name: `Almost Capped University ${i.toString()}`,
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        userId: user.id,
      })),
    });

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Twentieth University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    expect(response.status).toBe(201);
  });

  test("responds with status 404 when a track create parent study program does not exist", async () => {
    const { agent } = await createLoggedInAgent();
    const studyProgram = await createStudyProgram();
    await prisma.studyProgram.delete({ where: { id: studyProgram.id } });

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "TRACK",
      parentId: studyProgram.id,
      data: { name: "Orphan Track" },
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Parent entity not found." },
    });
  });
});

describe("Contribution Router - tree submissions", () => {
  test("accepts a nested university tree as a single pending change", async () => {
    const { agent, user } = await createLoggedInAgent();

    const tree = {
      name: "Tree University",
      city: "City",
      entity: "FBIH",
      ownership: "PUBLIC",
      faculties: [
        {
          name: "Faculty of Trees",
          studyPrograms: [
            {
              name: "Forestry",
              cycle: "FIRST",
              ects: 180,
              tracks: [{ name: "Urban Forestry", ects: 180 }],
            },
          ],
        },
        { name: "Faculty of Roots" },
      ],
    };

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: tree,
    });

    expect(response.status).toBe(201);

    const stored = await prisma.pendingChange.findMany({
      where: { userId: user.id },
    });
    expect(stored).toHaveLength(1);
    expect(stored[0]?.typeOfChange).toBe("CREATE");
    expect(stored[0]?.data).toEqual(tree);
  });

  test("accepts a faculty subtree with programs and tracks", async () => {
    const { agent } = await createLoggedInAgent();
    const university = await createUniversity();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "FACULTY",
      parentId: university.id,
      data: {
        name: "Subtree Faculty",
        studyPrograms: [
          {
            name: "Program A",
            cycle: "FIRST",
            tracks: [{ name: "Track A" }, { name: "Track B" }],
          },
          { name: "Program A", cycle: "SECOND" },
        ],
      },
    });

    expect(response.status).toBe(201);
  });

  test("accepts a study program subtree with tracks", async () => {
    const { agent } = await createLoggedInAgent();
    const faculty = await createFaculty();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "STUDY_PROGRAM",
      parentId: faculty.id,
      data: {
        name: "Subtree Program",
        cycle: "FIRST",
        tracks: [{ name: "Only Track" }],
      },
    });

    expect(response.status).toBe(201);
  });

  test("rejects duplicate faculty names in a university tree", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Duplicate Faculties University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [{ name: "Same Faculty" }, { name: "Same Faculty" }],
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, {
      path: "data.faculties.1.name",
      code: "custom",
    });
  });

  test("rejects duplicate study program name and cycle in a faculty", async () => {
    const { agent } = await createLoggedInAgent();
    const university = await createUniversity();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "FACULTY",
      parentId: university.id,
      data: {
        name: "Duplicate Programs Faculty",
        studyPrograms: [
          { name: "Same Program", cycle: "FIRST" },
          { name: "Same Program", cycle: "FIRST" },
        ],
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, {
      path: "data.studyPrograms.1.name",
      code: "custom",
    });
  });

  test("rejects duplicate track names in a study program", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Duplicate Tracks University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [
          {
            name: "Faculty",
            studyPrograms: [
              {
                name: "Program",
                cycle: "FIRST",
                tracks: [{ name: "Same Track" }, { name: "Same Track" }],
              },
            ],
          },
        ],
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, {
      path: "data.faculties.0.studyPrograms.0.tracks.1.name",
      code: "custom",
    });
  });

  test("rejects unknown fields on nested nodes", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Provenance Tree University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [
          { name: "Faculty", dataSourceUrl: "https://example.com/source" },
        ],
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, {
      path: "data.faculties.0",
      code: "unrecognized_keys",
    });
  });

  test("rejects an empty children array", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Empty Faculties University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: [],
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, {
      path: "data.faculties",
      code: "too_small",
    });
  });

  test("accepts a tree at exactly the node cap and rejects one above it", async () => {
    const { agent } = await createLoggedInAgent();

    const facultiesFor = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        name: `Cap Faculty ${index.toString()}`,
      }));

    const atCap = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "At Cap University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: facultiesFor(799),
      },
    });
    expect(atCap.status).toBe(201);

    const aboveCap = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Above Cap University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: facultiesFor(800),
      },
    });
    const responseBody = getResponseObject(aboveCap.body);
    const error = getResponseObject(responseBody["error"]);

    expect(aboveCap.status).toBe(400);
    expectValidationIssue(error, { path: "data", code: "custom" });
  });

  test("accepts a tree payload above the 100kb default body limit", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Large Payload University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        // ~700 faculties at ~200 bytes each puts the body well past 100kb
        faculties: Array.from({ length: 700 }, (_, index) => ({
          name: `Large Faculty ${index.toString()} ${"x".repeat(150)}`,
        })),
      },
    });

    expect(response.status).toBe(201);
  });
});

describe("Contribution Router - PUT /users/contribution/universities", () => {
  test("responds with status 401 when not logged in", async () => {
    const response = await request(app).put("/users/contribution/universities");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("responds with status 400 when targetType is missing", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.put("/users/contribution/universities");
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "request", code: "invalid_type" });
  });

  test("responds with status 400 when an edited field exceeds its max length", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: "1",
      data: { phone: "1".repeat(51) },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "data.phone", code: "too_big" });
  });

  test("responds with status 400 when an edit has no changes", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: 1,
      data: {},
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "data", code: "custom" });
  });

  test("responds with status 400 for a blank optional city update", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: 1,
      data: { city: "   " },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "data.city", code: "too_small" });
  });

  test("responds with status 400 when an ID is a numeric string", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: "1",
      data: { name: "Updated Name" },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "targetId", code: "invalid_type" });
  });

  test("allows null to clear an optional faculty city", async () => {
    const { agent, user } = await createLoggedInAgent();
    const created = await createFaculty();
    const faculty = await prisma.faculty.update({
      where: { id: created.id },
      data: { city: "Clear Me City" },
    });

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "FACULTY",
      targetId: faculty.id,
      data: { city: null },
    });

    expect(response.status).toBe(201);
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const pendingChange = await prisma.pendingChange.findUnique({
      where: { id: data["id"] as string },
    });

    expect(pendingChange).toEqual(
      expect.objectContaining({
        userId: user.id,
        targetType: "FACULTY",
        targetId: faculty.id,
        data: { city: null },
      }),
    );
  });

  test("responds with status 201 and stores an edit suggestion", async () => {
    const { agent, user } = await createLoggedInAgent();
    const university = await createUniversity();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: university.id,
      data: { name: "Updated Name" },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Edit suggestion submitted. An admin will review it.",
      }),
    );

    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const pendingChangeId = data["id"] as string;
    const pendingChange = await prisma.pendingChange.findUnique({
      where: { id: pendingChangeId },
    });

    expect(pendingChange).toEqual(
      expect.objectContaining({
        userId: user.id,
        targetType: "UNIVERSITY",
        typeOfChange: "UPDATE",
        targetId: university.id,
        data: { name: "Updated Name" },
      }),
    );
  });

  test("responds with status 400 when the edit matches the current data", async () => {
    const { agent } = await createLoggedInAgent();
    const university = await createUniversity();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: university.id,
      data: { name: university.name, city: university.city, phone: null },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["code"]).toBe("NO_CHANGES");
  });

  test("responds with status 201 when at least one edited field differs", async () => {
    const { agent } = await createLoggedInAgent();
    const university = await createUniversity();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: university.id,
      data: { name: university.name, city: "Different City" },
    });

    expect(response.status).toBe(201);
  });

  test("responds with status 404 when an edit target does not exist", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      targetId: 999999,
      data: { name: "Updated Name" },
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Target entity not found." },
    });
  });

  test("responds with status 201 and stores a track edit suggestion", async () => {
    const { agent, user } = await createLoggedInAgent();
    const studyProgram = await createStudyProgram();
    entitySequence++;
    const track = await prisma.track.create({
      data: {
        name: `Test Track ${entitySequence.toString()}`,
        studyProgramId: studyProgram.id,
      },
    });

    const response = await agent.put("/users/contribution/universities").send({
      targetType: "TRACK",
      targetId: track.id,
      data: { name: "Updated Track Name" },
    });

    expect(response.status).toBe(201);
    const stored = await prisma.pendingChange.findFirst({
      where: { userId: user.id, targetType: "TRACK" },
    });
    expect(stored).toEqual(
      expect.objectContaining({
        typeOfChange: "UPDATE",
        targetId: track.id,
        data: { name: "Updated Track Name" },
      }),
    );
  });
});

describe("Contribution Router - DELETE /users/contribution/universities", () => {
  test("responds with status 401 when not logged in", async () => {
    const response = await request(app).delete(
      "/users/contribution/universities",
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("responds with status 400 when targetType is missing", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.delete("/users/contribution/universities");
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "request", code: "invalid_type" });
  });

  test("responds with status 201 and stores a deletion suggestion", async () => {
    const { agent, user } = await createLoggedInAgent();
    const university = await createUniversity();

    const response = await agent
      .delete("/users/contribution/universities")
      .send({ targetType: "UNIVERSITY", targetId: university.id });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Deletion suggestion submitted. An admin will review it.",
      }),
    );

    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const pendingChangeId = data["id"] as string;
    const pendingChange = await prisma.pendingChange.findUnique({
      where: { id: pendingChangeId },
    });

    expect(pendingChange).toEqual(
      expect.objectContaining({
        userId: user.id,
        targetType: "UNIVERSITY",
        typeOfChange: "DELETE",
        targetId: university.id,
        data: {},
      }),
    );
  });

  test("responds with status 404 when a deletion target does not exist", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent
      .delete("/users/contribution/universities")
      .send({ targetType: "UNIVERSITY", targetId: 999999 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Target entity not found." },
    });
  });
});

describe("Contribution Router - GET /users/contribution/pending-changes/universities", () => {
  test("responds with status 401 when not logged in", async () => {
    const response = await request(app).get(
      "/users/contribution/pending-changes/universities",
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("responds with status 200 and only returns pending changes for the logged-in user", async () => {
    const { agent, user } = await createLoggedInAgent();
    const otherUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: "other-user",
        email: `other_${Date.now().toString()}@example.com`,
        updatedAt: new Date(),
      },
    });

    const ownPendingChange = await prisma.pendingChange.create({
      data: {
        targetType: "UNIVERSITY",
        typeOfChange: "CREATE",
        data: {
          name: "Own University",
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        user: { connect: { id: user.id } },
      },
    });
    await prisma.pendingChange.create({
      data: {
        targetType: "UNIVERSITY",
        typeOfChange: "CREATE",
        data: {
          name: "Other University",
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        user: { connect: { id: otherUser.id } },
      },
    });

    const response = await agent.get(
      "/users/contribution/pending-changes/universities",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Pending changes retrieved successfully.",
      }),
    );
    const responseBody = getResponseObject(response.body);
    expect(Array.isArray(responseBody["data"])).toBe(true);
    const data = responseBody["data"] as Record<string, unknown>[];
    expect(data).toHaveLength(1);
    expect(data[0]).toEqual(
      expect.objectContaining({
        id: ownPendingChange.id,
        userId: user.id,
      }),
    );
  });
});

describe("Contribution Router - pending changes ordering", () => {
  test("returns pending changes oldest first", async () => {
    const { agent, user } = await createLoggedInAgent();
    const changeData = {
      name: "Ordered University",
      city: "City",
      entity: "FBIH",
      ownership: "PUBLIC",
    };
    const newer = await prisma.pendingChange.create({
      data: {
        targetType: "UNIVERSITY",
        typeOfChange: "CREATE",
        data: changeData,
        createdAt: new Date("2026-02-01T00:00:00.000Z"),
        user: { connect: { id: user.id } },
      },
    });
    const older = await prisma.pendingChange.create({
      data: {
        targetType: "UNIVERSITY",
        typeOfChange: "CREATE",
        data: changeData,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        user: { connect: { id: user.id } },
      },
    });

    const response = await agent.get(
      "/users/contribution/pending-changes/universities",
    );

    expect(response.status).toBe(200);
    const data = getResponseObject(response.body)["data"] as {
      id: string;
    }[];
    expect(data.map((change) => change.id)).toEqual([older.id, newer.id]);
  });
});

describe("Contribution Router - DELETE /users/contribution/pending-changes/universities", () => {
  test("responds with status 401 when not logged in", async () => {
    const response = await request(app).delete(
      "/users/contribution/pending-changes/universities",
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required: log in and try again.",
      },
    });
  });

  test("responds with status 404 when the pending change does not exist for the logged-in user", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent
      .delete("/users/contribution/pending-changes/universities")
      .send({ id: "4e7d6077-6b57-48d1-a113-686731b5137e" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Pending change not found.",
      },
    });
  });

  test("responds with status 200 and deletes an existing pending change", async () => {
    const { agent, user } = await createLoggedInAgent();
    const pendingChange = await prisma.pendingChange.create({
      data: {
        targetType: "UNIVERSITY",
        typeOfChange: "CREATE",
        data: {
          name: "Delete Me",
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
        user: { connect: { id: user.id } },
      },
    });

    const response = await agent
      .delete("/users/contribution/pending-changes/universities")
      .send({ id: pendingChange.id });
    const pendingChangeInDb = await prisma.pendingChange.findUnique({
      where: { id: pendingChange.id },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: null,
      message: "Pending change deleted successfully.",
    });
    expect(pendingChangeInDb).toBeNull();
  });
});

describe("Contribution Router - malicious input", () => {
  test("responds with status 403 when the Origin header does not match the webapp", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent
      .post("/users/contribution/universities")
      .set("Origin", "https://evil.example")
      .send({
        targetType: "UNIVERSITY",
        data: {
          name: "Evil Origin University",
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: "FORBIDDEN", message: "Request origin is not allowed." },
    });
  });

  test("responds with status 201 when the Origin header matches the webapp", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent
      .post("/users/contribution/universities")
      .set("Origin", env.WEBAPP_URL)
      .send({
        targetType: "UNIVERSITY",
        data: {
          name: "Matching Origin University",
          city: "City",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
      });

    expect(response.status).toBe(201);
  });

  test("stores HTML-sensitive characters verbatim without interpreting them", async () => {
    const { agent } = await createLoggedInAgent();
    const name = `<script>alert(1)</script> & "quoted" $' $&`;

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: { name, city: "City", entity: "FBIH", ownership: "PUBLIC" },
    });

    expect(response.status).toBe(201);
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const pendingChange = await prisma.pendingChange.findUnique({
      where: { id: data["id"] as string },
    });
    expect((pendingChange?.data as { name: string }).name).toBe(name);
  });

  test.each([
    "data:text/html,<script>alert(1)</script>",
    "vbscript:Evil(1)",
    "//evil.example/path",
    "JavaScript:alert(1)",
    "java\nscript:alert(1)",
    "ftp://example.com/file",
  ])("responds with status 400 for unsafe website URL %s", async (website) => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "Unsafe URL University",
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
        website,
      },
    });
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, {
      path: "data.website",
      code: "invalid_format",
    });
  });

  test("responds with status 400 for __proto__ and constructor keys", async () => {
    const { agent } = await createLoggedInAgent();

    // a JS object literal would set the actual prototype instead of a key,
    // so the payload goes out as raw JSON
    const body = `{
      "targetType": "UNIVERSITY",
      "data": {
        "name": "Proto University",
        "city": "City",
        "entity": "FBIH",
        "ownership": "PUBLIC",
        "__proto__": { "polluted": true },
        "constructor": { "polluted": true }
      }
    }`;

    const response = await agent
      .post("/users/contribution/universities")
      .set("Content-Type", "application/json")
      .send(body);
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expectValidationIssue(error, { path: "data", code: "unrecognized_keys" });
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  test("responds with status 413 when the body exceeds the JSON size limit", async () => {
    const { agent } = await createLoggedInAgent();

    const response = await agent.post("/users/contribution/universities").send({
      targetType: "UNIVERSITY",
      data: {
        name: "x".repeat(600 * 1024),
        city: "City",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    expect(response.status).toBe(413);
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);
    expect(error["code"]).toBe("REQUEST_FAILED");
  });
});
