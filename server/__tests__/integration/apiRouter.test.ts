import request from "supertest";
import { app } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { describe, test, expect } from "vitest";

describe("GET /", () => {
  test("responds with the service index", async () => {
    const response = await request(app).get("/");
    const expectedResponse = {
      status: 200,
      body: {
        message: "Atlas Univerziteta API server is running.",
        data: {
          name: "Atlas Univerziteta API",
          docs: `${env.WEBAPP_URL}/api-docs`,
          endpoints: {
            health: "/health",
            v1: "/api/v1",
          },
        },
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});
