import {
  sanitizeUser,
  sanitizeUsers,
} from "../../../src/utils/sanitizeUser.js";
import { describe, test, expect } from "vitest";

import type { User } from "../../../src/generated/prisma/client.js";

describe("sanitizeUser", () => {
  test("should remove password from user object", () => {
    const user: User = {
      id: "1",
      role: "USER",
      password: "secret",
      email: "testuser@example.com",
      githubId: "123456",
      googleId: null,
      adminRequestedAt: null,
    };
    const sanitizedUser = sanitizeUser(user);

    expect(sanitizedUser).not.toHaveProperty("password");
    expect(sanitizedUser).toHaveProperty("email", "testuser@example.com");
    expect(sanitizedUser).toHaveProperty("adminRequestedAt", null);
  });
});

describe("sanitizeUsers", () => {
  test("should return an empty array if users is empty", () => {
    expect(sanitizeUsers([])).toEqual([]);
  });

  test("should sanitize an array of user objects", () => {
    const users: User[] = [
      {
        id: "1",
        password: "secret1",
        email: "user1@example.com",
        githubId: "123456",
        googleId: null,
        role: "USER",
        adminRequestedAt: null,
      },
      {
        id: "2",
        password: "secret2",
        email: "user2@example.com",
        githubId: "654321",
        googleId: null,
        role: "ADMIN",
        adminRequestedAt: null,
      },
    ];
    const sanitizedUsers = sanitizeUsers(users);
    sanitizedUsers.forEach((user) => {
      expect(user).not.toHaveProperty("password");
      expect(user).toHaveProperty("email");
    });
  });
});
