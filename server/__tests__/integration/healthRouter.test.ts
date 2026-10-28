import request from "supertest";
import { app } from "../../src/app.js";
import { describe, test, expect, vi } from "vitest";
import { prisma } from "../../src/db/prisma.js";

describe("GET /health/", () => {
  test("responds with status 200 when healthy", async () => {
    const response = await request(app).get("/health/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: "ok",
        database: "ok",
      },
      message: "Server is healthy",
    });
  });

  test("responds with status 503 when the database is unreachable", async () => {
    const queryRawSpy = vi
      .spyOn(prisma, "$queryRaw")
      .mockRejectedValueOnce(new Error("connection refused"));

    const response = await request(app).get("/health/");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: { code: "UNAVAILABLE", message: "Database unreachable." },
    });
    queryRawSpy.mockRestore();
  });
});
