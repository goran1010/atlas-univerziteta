import {
  sanitizeUser,
  sanitizeUsers,
} from "../../../src/utils/sanitizeUser.js";
import { describe, test, expect } from "vitest";

import type { user } from "../../../src/generated/prisma/client.js";

const now = new Date();

describe("sanitizeUser", () => {
  test("should return user fields without relations", () => {
    const dbUser: user = {
      id: "1",
      name: "Test User",
      email: "testuser@example.com",
      emailVerified: true,
      image: null,
      role: "USER",
      adminRequestedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const sanitized = sanitizeUser(dbUser);

    expect(sanitized).toEqual({
      id: "1",
      name: "Test User",
      email: "testuser@example.com",
      emailVerified: true,
      image: null,
      role: "USER",
      adminRequestedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  });
});

describe("sanitizeUsers", () => {
  test("should return an empty array if users is empty", () => {
    expect(sanitizeUsers([])).toEqual([]);
  });

  test("should sanitize an array of user objects", () => {
    const users: user[] = [
      {
        id: "1",
        name: "User One",
        email: "user1@example.com",
        emailVerified: true,
        image: null,
        role: "USER",
        adminRequestedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "2",
        name: "User Two",
        email: "user2@example.com",
        emailVerified: true,
        image: null,
        role: "ADMIN",
        adminRequestedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ];
    const sanitizedUsers = sanitizeUsers(users);
    sanitizedUsers.forEach((u) => {
      expect(u).toHaveProperty("email");
      expect(u).toHaveProperty("name");
    });
  });
});
