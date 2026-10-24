import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "vitest";

import { app } from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import { foldUniversityFixture } from "../utils/foldSearchFixture.js";
import {
  getResponseObject,
  getResponseArray,
} from "../utils/responseHelpers.js";

beforeAll(async () => {
  await prisma.university.createMany({
    data: Array.from({ length: 3 }, (_, i) =>
      foldUniversityFixture({
        name: `Pagination University ${String(i)}`,
        city: "PaginationCity",
        entity: "FBIH",
        ownership: "PUBLIC",
      }),
    ),
  });
});

afterAll(async () => {
  await prisma.university.deleteMany({
    where: { name: { contains: "Pagination University" } },
  });
});

describe("GET /api/v1/universities pagination", () => {
  test("pages through results and reports totals", async () => {
    const firstPage = await request(app).get("/api/v1/universities?limit=2");
    const firstBody = getResponseObject(firstPage.body);

    expect(firstPage.status).toBe(200);
    expect(getResponseArray(firstBody["data"])).toHaveLength(2);
    expect(firstBody["page"]).toBe(1);
    expect(firstBody["totalPages"]).toBe(2);
    expect(firstBody["total"]).toBe(3);

    const secondPage = await request(app).get(
      "/api/v1/universities?limit=2&page=2",
    );
    const secondBody = getResponseObject(secondPage.body);

    expect(getResponseArray(secondBody["data"])).toHaveLength(1);
    expect(secondBody["page"]).toBe(2);
  });

  test("defaults to the first page of fifty", async () => {
    const response = await request(app).get("/api/v1/universities");
    const responseBody = getResponseObject(response.body);

    expect(response.status).toBe(200);
    expect(responseBody["page"]).toBe(1);
    expect(responseBody["total"]).toBe(3);
  });

  test("rejects a limit over one hundred", async () => {
    const response = await request(app).get("/api/v1/universities?limit=101");
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["code"]).toBe("VALIDATION_ERROR");
  });

  test("list items carry the directory fields and no internal columns", async () => {
    const response = await request(app).get("/api/v1/universities?limit=1");
    const [item] = getResponseArray(getResponseObject(response.body)["data"]);
    const university = getResponseObject(item);

    expect(university).toMatchObject({
      name: "Pagination University 0",
      city: "PaginationCity",
      _count: { faculties: 0 },
    });
    expect(university).not.toHaveProperty("searchName");
    expect(university).not.toHaveProperty("address");
  });
});

describe("internal search columns stay out of responses", () => {
  test("detail responses omit the folded search fields", async () => {
    const created = await prisma.university.findFirst({
      where: { name: "Pagination University 0" },
    });
    if (!created) throw new Error("fixture missing");

    const response = await request(app).get(
      `/api/v1/universities/${created.id.toString()}`,
    );
    const university = getResponseObject(
      getResponseObject(response.body)["data"],
    );

    expect(response.status).toBe(200);
    expect(university).not.toHaveProperty("searchName");
    expect(university).not.toHaveProperty("searchCity");
    expect(university).toHaveProperty("address");
  });
});
