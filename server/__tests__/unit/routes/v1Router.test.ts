import request from "supertest";
import { app } from "../../../src/app.js";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../../src/db/prisma.js";

import type { University } from "../../../src/generated/prisma/client.js";
import type {
  UniversityFindManyArgs,
  UniversityFindUniqueArgs,
} from "../../../src/generated/prisma/models.js";

beforeEach(() => {
  vi.clearAllMocks();
});

const dummyData: { data: University[] } = {
  data: [
    {
      id: 1,
      name: "University of Sarajevo",
      city: "Sarajevo",
      acronym: "UNSA",
      entity: "FBIH",
      address: null,
      phone: null,
      email: null,
      accreditationFrom: null,
      accreditationTo: null,
      authority:
        "Ministry of Education and Science of the Federation of Bosnia and Herzegovina",
      foundedYear: "1949",
      lastModified: null,
      ownership: "PUBLIC",
      sourceUrl: "https://www.unsa.ba/en/university",
      website: "https://www.unsa.ba/en",
    },
    {
      id: 2,
      name: "University of Banja Luka",
      city: "Banja Luka",
      acronym: "UNIBL",
      entity: "RS",
      address: null,
      phone: null,
      email: null,
      accreditationFrom: null,
      accreditationTo: null,
      authority: "Ministry of Education and Culture of the Republika Srpska",
      foundedYear: "1975",
      lastModified: null,
      ownership: "PUBLIC",
      sourceUrl: "https://www.unibl.org/en/university",
      website: "https://www.unibl.org/en",
    },
  ],
};

vi.spyOn(prisma.studyProgram, "findMany").mockImplementation((args) => {
  const where = args?.where as
    | {
        AND?: { OR?: { name?: { contains?: string } }[] }[];
        OR?: { name?: { contains?: string } }[];
      }
    | undefined;
  const orClause = where?.AND?.[0]?.OR ?? where?.OR;
  const normalizedTerm = orClause?.[0]?.name?.contains?.toLowerCase() ?? "";

  const dummyStudyPrograms = [
    { id: 1, name: "Computer Science" },
    { id: 2, name: "Computer Engineering" },
  ];

  return Promise.resolve(
    dummyStudyPrograms.filter((sp) =>
      sp.name.toLowerCase().includes(normalizedTerm),
    ),
  ) as ReturnType<typeof prisma.studyProgram.findMany>;
});

vi.spyOn(prisma.faculty, "findMany").mockImplementation((args) => {
  const where = args?.where as
    | {
        AND?: { OR?: { name?: { contains?: string } }[] }[];
        OR?: { name?: { contains?: string } }[];
      }
    | undefined;
  const orClause = where?.AND?.[0]?.OR ?? where?.OR;
  const normalizedTerm = orClause?.[0]?.name?.contains?.toLowerCase() ?? "";

  const dummyFaculties = [
    { id: 1, name: "Faculty of Electrical Engineering", city: "Sarajevo" },
    { id: 2, name: "Faculty of Medicine", city: "Banja Luka" },
  ];

  return Promise.resolve(
    dummyFaculties.filter(
      (f) =>
        f.name.toLowerCase().includes(normalizedTerm) ||
        f.city.toLowerCase().includes(normalizedTerm),
    ),
  ) as ReturnType<typeof prisma.faculty.findMany>;
});

type FindUniqueUniversityImplementation = (
  args: UniversityFindUniqueArgs,
) => ReturnType<typeof prisma.university.findUnique>;

const mockFindUniqueUniversity: FindUniqueUniversityImplementation = ({
  where: { id },
}) => {
  const university = dummyData.data.find((u) => u.id === id);
  return Promise.resolve(university ?? null) as ReturnType<
    typeof prisma.university.findUnique
  >;
};

vi.spyOn(prisma.university, "findUnique").mockImplementation(
  mockFindUniqueUniversity,
);

function mockUniversitySearch(
  args?: UniversityFindManyArgs,
): ReturnType<typeof prisma.university.findMany> {
  const where = args?.where as
    | {
        AND?: { OR?: { name?: { contains?: string } }[] }[];
        OR?: { name?: { contains?: string } }[];
      }
    | undefined;

  const orClause = where?.AND?.[0]?.OR ?? where?.OR;
  const normalizedTerm = orClause?.[0]?.name?.contains?.toLowerCase() ?? "";

  return Promise.resolve(
    dummyData.data.filter(
      (u) =>
        u.name.toLowerCase().includes(normalizedTerm) ||
        u.city.toLowerCase().includes(normalizedTerm) ||
        u.acronym?.toLowerCase().includes(normalizedTerm),
    ),
  ) as ReturnType<typeof prisma.university.findMany>;
}

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

function getNamedItems(value: unknown): { name: string }[] {
  expect(Array.isArray(value)).toBe(true);

  return value as { name: string }[];
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
  vi.spyOn(prisma.university, "findMany").mockResolvedValue(dummyData.data);

  test("responds with status 200 and an array with dummy data", async () => {
    const response = await request(app).get("/api/v1/universities");
    const expectedResponse = {
      status: 200,
      body: {
        message: "Universities retrieved successfully.",
        data: dummyData.data,
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});

describe("GET /api/v1/search", () => {
  test("responds with status 200 and grouped results for searchTerm=Sarajevo", async () => {
    vi.spyOn(prisma.university, "findMany").mockImplementation(
      mockUniversitySearch,
    );
    const response = await request(app).get(
      "/api/v1/search?searchTerm=Sarajevo",
    );

    const dummyDataFiltered = dummyData.data.filter(
      (u) => u.city === "Sarajevo",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Search results retrieved successfully.",
    );
    expect(data["universities"]).toEqual(dummyDataFiltered);
    const faculties = getNamedItems(data["faculties"]);
    expect(faculties.map((f) => f.name)).toEqual([
      "Faculty of Electrical Engineering",
    ]);
    expect(data["studyPrograms"]).toEqual([]);
  });

  test("responds with status 200 and study programs for searchTerm=Computer", async () => {
    vi.spyOn(prisma.university, "findMany").mockImplementation(
      mockUniversitySearch,
    );
    const response = await request(app).get(
      "/api/v1/search?searchTerm=Computer",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const studyPrograms = getNamedItems(data["studyPrograms"]);

    expect(response.status).toBe(200);
    expect(data["universities"]).toEqual([]);
    expect(data["faculties"]).toEqual([]);
    expect(studyPrograms.map((sp) => sp.name)).toEqual([
      "Computer Science",
      "Computer Engineering",
    ]);
  });

  test("responds with status 404 for searchTerm=non-existent-anything", async () => {
    vi.spyOn(prisma.university, "findMany").mockImplementation(
      mockUniversitySearch,
    );
    const response = await request(app).get(
      "/api/v1/search?searchTerm=non-existent-anything",
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

  test("responds with status 400 for missing searchTerm", async () => {
    const response = await request(app).get("/api/v1/search");
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["code"]).toBe("VALIDATION_ERROR");
    expect(error["message"]).toBe("Request validation failed.");
    expect(error["issues"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "searchTerm" })]),
    );
  });

  test("responds with status 400 when searchTerm exceeds 100 characters", async () => {
    const response = await request(app).get(
      `/api/v1/search?searchTerm=${"a".repeat(101)}`,
    );
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["issues"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "searchTerm",
          message: "Search term must not exceed 100 characters.",
        }),
      ]),
    );
  });
});

describe("GET /api/v1/universities/:id", () => {
  test("responds with status 200 and the requested university", async () => {
    const response = await request(app).get("/api/v1/universities/1");
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("University retrieved successfully.");
    expect(data["id"]).toBe(1);
    expect(data["name"]).toBe("University of Sarajevo");
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

  test("responds with status 404 for non-existent university id", async () => {
    const response = await request(app).get("/api/v1/universities/999");
    const expectedResponse = {
      status: 404,
      body: {
        error: {
          message: "University not found.",
        },
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });

  test("responds with status 400 for emoji in university id", async () => {
    const response = await request(app).get("/api/v1/universities/😊");
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["message"]).toBeTypeOf("string");
    expect(error["message"]).toBe("Request validation failed.");
  });
});
