import request from "supertest";
import { app } from "../../src/app.js";
import { describe, test, expect } from "vitest";
import { prisma } from "../../src/db/prisma.js";

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

function getResponseArray(value: unknown): Record<string, unknown>[] {
  expect(Array.isArray(value)).toBe(true);

  return value as Record<string, unknown>[];
}

describe("GET /", () => {
  test("responds with status 200 when LIVE", async () => {
    const response = await request(app).get("/api/v1/");
    const expectedResponse = {
      status: 200,
      body: {
        data: {
          status: "ok",
        },
        message: "API v1 server is running",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});

describe("GET /api/v1/universities", () => {
  test("responds with status 200 and universities", async () => {
    const testUniversityName = "Test Integration University GET All";
    const existing = await prisma.university.findMany({
      where: { name: testUniversityName },
    });
    for (const u of existing) {
      await prisma.university.delete({ where: { id: u.id } });
    }

    const uniInDb = await prisma.university.create({
      data: {
        name: testUniversityName,
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const response = await request(app).get("/api/v1/universities");
    const responseBody = getResponseObject(response.body);
    const data = getResponseArray(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Universities retrieved successfully.",
    );
    expect(
      data.some(
        (university) =>
          university["name"] === uniInDb.name &&
          university["city"] === uniInDb.city,
      ),
    ).toBe(true);
    await prisma.university.delete({ where: { id: uniInDb.id } });
  });
});

describe("GET /api/v1/search", () => {
  test("responds with status 200 and universities matched by city", async () => {
    const testUniversityName = "Test Integration University Search";
    const existing = await prisma.university.findMany({
      where: { name: testUniversityName },
    });
    for (const u of existing) {
      await prisma.university.delete({ where: { id: u.id } });
    }

    const uniInDb = await prisma.university.create({
      data: {
        name: testUniversityName,
        city: "TestSearchCity",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const response = await request(app).get(
      "/api/v1/search?searchTerm=TestSearchCity",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const universities = getResponseArray(data["universities"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Search results retrieved successfully.",
    );
    expect(
      universities.some(
        (university) =>
          university["name"] === uniInDb.name &&
          university["city"] === uniInDb.city,
      ),
    ).toBe(true);

    await prisma.university.delete({ where: { id: uniInDb.id } });
  });

  test("responds with status 404 when nothing matches", async () => {
    const response = await request(app).get(
      "/api/v1/search?searchTerm=completely-nonexistent-term-xyz",
    );
    const expectedResponse = {
      status: 404,
      body: {
        error: {
          message: "No results found matching your search.",
        },
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});

describe("GET /api/v1/universities/:id", () => {
  test("responds with status 200 and a university by id", async () => {
    const uniInDb = await prisma.university.create({
      data: {
        name: "Test Integration University By ID",
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: "Test Integration Faculty By ID",
            studyPrograms: {
              create: {
                name: "Test Integration Study Program By ID",
                cycle: "FIRST",
                subjects: {
                  create: {
                    name: "Test Integration Subject By ID",
                    type: "MANDATORY",
                  },
                },
              },
            },
          },
        },
      },
    });

    const response = await request(app).get(
      `/api/v1/universities/${String(uniInDb.id)}`,
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("University retrieved successfully.");
    expect(data["id"]).toBe(uniInDb.id);
    expect(data["name"]).toBe(uniInDb.name);
    const faculties = getResponseArray(data["faculties"]);
    const studyPrograms = getResponseArray(faculties[0]?.["studyPrograms"]);
    const subjects = getResponseArray(studyPrograms[0]?.["subjects"]);

    expect(faculties[0]?.["name"]).toBe("Test Integration Faculty By ID");
    expect(studyPrograms[0]?.["name"]).toBe(
      "Test Integration Study Program By ID",
    );
    expect(subjects[0]?.["name"]).toBe("Test Integration Subject By ID");

    await prisma.subject.deleteMany({
      where: {
        studyProgram: {
          faculty: {
            universityId: uniInDb.id,
          },
        },
      },
    });
    await prisma.studyProgram.deleteMany({
      where: { faculty: { universityId: uniInDb.id } },
    });
    await prisma.faculty.deleteMany({ where: { universityId: uniInDb.id } });
    await prisma.university.delete({ where: { id: uniInDb.id } });
  });

  test("responds with status 400 for invalid university id", async () => {
    const response = await request(app).get(
      "/api/v1/universities/not-a-number",
    );
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["message"]).toBeTypeOf("string");
    expect(error["message"]).toBe("Request validation failed.");
  });
});

describe("GET /api/v1/search - related entities", () => {
  test("responds with grouped faculties, study programs, and subjects including parent data", async () => {
    const university = await prisma.university.create({
      data: {
        name: "Test Integration Unified Search University",
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: "Test Integration Unified Search Faculty",
            studyPrograms: {
              create: {
                name: "Test Integration Unified Search Program",
                cycle: "FIRST",
                subjects: {
                  create: {
                    name: "Test Integration Unified Search Subject",
                    type: "MANDATORY",
                  },
                },
              },
            },
          },
        },
      },
    });

    const response = await request(app).get(
      "/api/v1/search?searchTerm=Test%20Integration%20Unified%20Search",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    const universities = getResponseArray(data["universities"]);
    const faculties = getResponseArray(data["faculties"]);
    const studyPrograms = getResponseArray(data["studyPrograms"]);
    const subjects = getResponseArray(data["subjects"]);

    expect(response.status).toBe(200);
    expect(universities.some((u) => u["name"] === university.name)).toBe(true);

    const faculty = faculties.find(
      (f) => f["name"] === "Test Integration Unified Search Faculty",
    );
    const facultyUniversity = getResponseObject(faculty?.["university"]);
    expect(facultyUniversity["id"]).toBe(university.id);

    const program = studyPrograms.find(
      (sp) => sp["name"] === "Test Integration Unified Search Program",
    );
    expect(program?.["cycle"]).toBe("FIRST");
    const programFaculty = getResponseObject(program?.["faculty"]);
    const programUniversity = getResponseObject(programFaculty["university"]);
    expect(programUniversity["id"]).toBe(university.id);

    const subject = subjects.find(
      (s) => s["name"] === "Test Integration Unified Search Subject",
    );
    const subjectProgram = getResponseObject(subject?.["studyProgram"]);
    const subjectFaculty = getResponseObject(subjectProgram["faculty"]);
    const subjectUniversity = getResponseObject(subjectFaculty["university"]);
    expect(subjectUniversity["id"]).toBe(university.id);

    await prisma.subject.deleteMany({
      where: {
        studyProgram: { faculty: { universityId: university.id } },
      },
    });
    await prisma.studyProgram.deleteMany({
      where: { faculty: { universityId: university.id } },
    });
    await prisma.faculty.deleteMany({ where: { universityId: university.id } });
    await prisma.university.delete({ where: { id: university.id } });
  });
});

describe("GET /api/v1/search - diacritic-insensitive matching", () => {
  test("matches accented data from ASCII terms and vice versa", async () => {
    const testUniversityName = "Test Diacritics Univerzitet Ćuprija";
    const existing = await prisma.university.findMany({
      where: { name: testUniversityName },
    });
    for (const u of existing) {
      await prisma.subject.deleteMany({
        where: { studyProgram: { faculty: { universityId: u.id } } },
      });
      await prisma.studyProgram.deleteMany({
        where: { faculty: { universityId: u.id } },
      });
      await prisma.faculty.deleteMany({ where: { universityId: u.id } });
      await prisma.university.delete({ where: { id: u.id } });
    }

    const university = await prisma.university.create({
      data: {
        name: testUniversityName,
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: "Test Diacritics Džemal",
            studyPrograms: {
              create: {
                name: "Test Diacritics Program",
                cycle: "FIRST",
                subjects: {
                  create: {
                    name: "Test Diacritics Racunari",
                    type: "MANDATORY",
                  },
                },
              },
            },
          },
        },
      },
    });

    const universityResponse = await request(app).get(
      "/api/v1/search?searchTerm=cuprija",
    );
    const universityBody = getResponseObject(universityResponse.body);
    const universityData = getResponseObject(universityBody["data"]);
    const universities = getResponseArray(universityData["universities"]);

    expect(universityResponse.status).toBe(200);
    expect(universities.some((u) => u["name"] === testUniversityName)).toBe(
      true,
    );

    const facultyResponse = await request(app).get(
      "/api/v1/search?searchTerm=dzemal",
    );
    const facultyBody = getResponseObject(facultyResponse.body);
    const facultyData = getResponseObject(facultyBody["data"]);
    const faculties = getResponseArray(facultyData["faculties"]);

    expect(facultyResponse.status).toBe(200);
    expect(faculties.some((f) => f["name"] === "Test Diacritics Džemal")).toBe(
      true,
    );

    const subjectResponse = await request(app).get(
      `/api/v1/search?searchTerm=${encodeURIComponent("računari")}`,
    );
    const subjectBody = getResponseObject(subjectResponse.body);
    const subjectData = getResponseObject(subjectBody["data"]);
    const subjects = getResponseArray(subjectData["subjects"]);

    expect(subjectResponse.status).toBe(200);
    expect(subjects.some((s) => s["name"] === "Test Diacritics Racunari")).toBe(
      true,
    );

    await prisma.subject.deleteMany({
      where: {
        studyProgram: { faculty: { universityId: university.id } },
      },
    });
    await prisma.studyProgram.deleteMany({
      where: { faculty: { universityId: university.id } },
    });
    await prisma.faculty.deleteMany({ where: { universityId: university.id } });
    await prisma.university.delete({ where: { id: university.id } });
  });
});
