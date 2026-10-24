import request from "supertest";
import { describe, test, expect, vi } from "vitest";

import { app } from "../../src/app.js";
import * as rateLimiter from "../../src/utils/rateLimiter.js";

// The limiters are mocked as vi.fn no-op wrappers in mocks.setup.ts; these
// tests only verify each one is mounted on its route, not its behavior
// (covered by the unit test).
describe("rate limiter mounts", () => {
  test("auth limiter guards /api/auth", async () => {
    vi.mocked(rateLimiter.auth).mockClear();

    await request(app).post("/api/auth/sign-in/email").send({});

    expect(rateLimiter.auth).toHaveBeenCalled();
  });

  test("api limiter guards /api", async () => {
    vi.mocked(rateLimiter.api).mockClear();

    await request(app).get("/api");

    expect(rateLimiter.api).toHaveBeenCalled();
  });

  test("users limiter guards /users", async () => {
    vi.mocked(rateLimiter.users).mockClear();

    await request(app).get("/users/pending-changes");

    expect(rateLimiter.users).toHaveBeenCalled();
  });
});
