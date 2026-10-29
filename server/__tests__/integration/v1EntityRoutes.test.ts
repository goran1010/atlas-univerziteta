import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import {
  getResponseObject,
  getResponseArray,
} from "../utils/responseHelpers.js";

let universityId: number;
let facultyId: number;
let studyProgramId: number;
let trackId: number;

beforeAll(async () => {
  const university = await prisma.university.create({
    data: {
      name: "Test V1 University",
      city: "Test City",
      country: "BIH",
      entity: "FBIH",
      ownership: "PUBLIC",
      faculties: {
        create: {
          name: "Test V1 Faculty",
          city: "Test City",
          studyPrograms: {
            create: {
              name: "Test V1 Study Program",
              cycle: "FIRST",
              tracks: { create: { name: "Test V1 Track" } },
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

function expectValidationFailure(response: request.Response) {
  const responseBody = getResponseObject(response.body);
  const error = getResponseObject(responseBody["error"]);

  expect(response.status).toBe(400);
  expect(error["message"]).toBe("Request validation failed.");
}

describe("GET /api/v1/faculties", () => {
  test("responds with status 200 and faculties including their university", async () => {
    const response = await request(app).get("/api/v1/faculties");
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("Faculties retrieved successfully.");
    const data = getResponseArray(responseBody["data"]);
    const faculty = data.find((f) => f["id"] === facultyId);
    expect(faculty?.["name"]).toBe("Test V1 Faculty");
    const university = getResponseObject(faculty?.["university"]);
    expect(university["id"]).toBe(universityId);
  });
});

describe("GET /api/v1/faculties/:id", () => {
  test("responds with status 200 and the faculty with nested programs and tracks", async () => {
    const response = await request(app).get(
      `/api/v1/faculties/${String(facultyId)}`,
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("Faculty retrieved successfully.");
    expect(data["name"]).toBe("Test V1 Faculty");
    expect(getResponseObject(data["university"])["id"]).toBe(universityId);
    const studyPrograms = getResponseArray(data["studyPrograms"]);
    expect(studyPrograms[0]?.["name"]).toBe("Test V1 Study Program");
    const tracks = getResponseArray(studyPrograms[0]?.["tracks"]);
    expect(tracks[0]?.["name"]).toBe("Test V1 Track");
  });

  test("responds with status 400 for an invalid faculty id", async () => {
    const response = await request(app).get("/api/v1/faculties/not-a-number");

    expectValidationFailure(response);
  });

  test("responds with status 404 for a non-existent faculty id", async () => {
    const faculty = await prisma.faculty.create({
      data: { name: "Test V1 Missing Faculty", universityId },
    });
    await prisma.faculty.delete({ where: { id: faculty.id } });

    const response = await request(app).get(
      `/api/v1/faculties/${String(faculty.id)}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Faculty not found." },
    });
  });
});

describe("GET /api/v1/study-programs", () => {
  test("responds with status 200 and programs including faculty and university", async () => {
    const response = await request(app).get("/api/v1/study-programs");
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Study programs retrieved successfully.",
    );
    const data = getResponseArray(responseBody["data"]);
    const studyProgram = data.find((sp) => sp["id"] === studyProgramId);
    expect(studyProgram?.["name"]).toBe("Test V1 Study Program");
    const faculty = getResponseObject(studyProgram?.["faculty"]);
    expect(faculty["id"]).toBe(facultyId);
    expect(getResponseObject(faculty["university"])["id"]).toBe(universityId);
  });
});

describe("GET /api/v1/study-programs/:id", () => {
  test("responds with status 200 and the program with faculty, university and tracks", async () => {
    const response = await request(app).get(
      `/api/v1/study-programs/${String(studyProgramId)}`,
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Study program retrieved successfully.",
    );
    expect(data["name"]).toBe("Test V1 Study Program");
    const faculty = getResponseObject(data["faculty"]);
    expect(faculty["id"]).toBe(facultyId);
    expect(getResponseObject(faculty["university"])["id"]).toBe(universityId);
    const tracks = getResponseArray(data["tracks"]);
    expect(tracks[0]?.["name"]).toBe("Test V1 Track");
  });

  test("responds with status 400 for an invalid study program id", async () => {
    const response = await request(app).get(
      "/api/v1/study-programs/not-a-number",
    );

    expectValidationFailure(response);
  });

  test("responds with status 404 for a non-existent study program id", async () => {
    const studyProgram = await prisma.studyProgram.create({
      data: { name: "Test V1 Missing Program", cycle: "FIRST", facultyId },
    });
    await prisma.studyProgram.delete({ where: { id: studyProgram.id } });

    const response = await request(app).get(
      `/api/v1/study-programs/${String(studyProgram.id)}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Study program not found." },
    });
  });
});

describe("GET /api/v1/tracks", () => {
  test("responds with status 200 and tracks including the full parent chain", async () => {
    const response = await request(app).get("/api/v1/tracks");
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("Tracks retrieved successfully.");
    const data = getResponseArray(responseBody["data"]);
    const track = data.find((t) => t["id"] === trackId);
    expect(track?.["name"]).toBe("Test V1 Track");
    const studyProgram = getResponseObject(track?.["studyProgram"]);
    expect(studyProgram["id"]).toBe(studyProgramId);
    const faculty = getResponseObject(studyProgram["faculty"]);
    expect(getResponseObject(faculty["university"])["id"]).toBe(universityId);
  });
});

describe("GET /api/v1/tracks/:id", () => {
  test("responds with status 200 and the track with the full parent chain", async () => {
    const response = await request(app).get(
      `/api/v1/tracks/${String(trackId)}`,
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("Track retrieved successfully.");
    expect(data["name"]).toBe("Test V1 Track");
    const studyProgram = getResponseObject(data["studyProgram"]);
    expect(studyProgram["id"]).toBe(studyProgramId);
    const faculty = getResponseObject(studyProgram["faculty"]);
    expect(faculty["id"]).toBe(facultyId);
    expect(getResponseObject(faculty["university"])["id"]).toBe(universityId);
  });

  test("responds with status 400 for an invalid track id", async () => {
    const response = await request(app).get("/api/v1/tracks/not-a-number");

    expectValidationFailure(response);
  });

  test("responds with status 404 for a non-existent track id", async () => {
    const track = await prisma.track.create({
      data: { name: "Test V1 Missing Track", studyProgramId },
    });
    await prisma.track.delete({ where: { id: track.id } });

    const response = await request(app).get(
      `/api/v1/tracks/${String(track.id)}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Track not found." },
    });
  });
});
