import request from "supertest";
import { describe, test, expect } from "vitest";

import { app } from "../../src/app.js";

describe("Cache-Control", () => {
  test("public /api/v1 GETs are cacheable", async () => {
    const response = await request(app).get("/api/v1/universities");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=300");
  });

  test("credentialed /users responses are not", async () => {
    const response = await request(app).get("/users/pending-changes");

    expect(response.headers["cache-control"]).toBeUndefined();
  });

  test("health checks are not", async () => {
    const response = await request(app).get("/health");

    expect(response.headers["cache-control"]).toBeUndefined();
  });
});
