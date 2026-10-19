import express from "express";
import request from "supertest";
import { describe, test, expect, vi, afterAll } from "vitest";

// The global setup replaces every limiter with a pass-through; this file
// tests the real thing.
vi.unmock("../../../src/utils/rateLimiter.js");

const { auth } = await import("../../../src/utils/rateLimiter.js");

const app = express();
app.use(auth);
app.get("/", (_req, res) => {
  res.json({ ok: true });
});
const server = app.listen(0);

afterAll(() => {
  server.close();
});

describe("auth rate limiter", () => {
  test("responds with status 429 and RATE_LIMITED once the limit is exhausted", async () => {
    // Non-production limit is 500 requests per window; exhaust it in batches
    const BATCH = 50;
    for (let i = 0; i < 500 / BATCH; i++) {
      const responses = await Promise.all(
        Array.from({ length: BATCH }, () => request(server).get("/")),
      );
      for (const response of responses) {
        expect(response.status).toBe(200);
      }
    }

    const limited = await request(server).get("/");

    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message:
          "Too many login attempts. Please wait 15 minutes, then try again.",
      },
    });
  });
});
