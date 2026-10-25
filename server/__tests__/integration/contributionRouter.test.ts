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
    const faculty = await createFaculty();

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
        name: "x".repeat(200 * 1024),
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
