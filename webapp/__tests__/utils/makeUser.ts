import type { UserData } from "../../src/types";

type User = NonNullable<UserData>;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-id",
    name: "test",
    email: "test@example.com",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: "USER",
    ...overrides,
  };
}

export { makeUser };
