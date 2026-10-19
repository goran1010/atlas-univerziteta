import request from "supertest";
import { app } from "../../src/app.js";
import { describe, test, expect } from "vitest";

describe("GET /health/", () => {
  test("responds with status 200 when healthy", async () => {
    const response = await request(app).get("/health/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: "ok",
      },
      message: "Server is healthy",
    });
  });
});
