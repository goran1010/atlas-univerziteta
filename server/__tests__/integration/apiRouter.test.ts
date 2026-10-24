import request from "supertest";
import { app } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { describe, test, expect } from "vitest";

describe("GET /", () => {
  test("responds with the service index", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Atlas Univerziteta API server is running.",
      data: {
        name: "Atlas Univerziteta API",
        docs: `${env.WEBAPP_URL}/api-docs`,
        endpoints: {
          health: "/health",
          v1: "/api/v1",
        },
      },
    });
  });
});

describe("GET /api", () => {
  test("responds with the API status", async () => {
    const response = await request(app).get("/api");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: "ok",
      },
      message: "API server is running",
    });
  });
});
