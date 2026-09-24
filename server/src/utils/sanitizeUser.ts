import type { user as PrismaUser } from "../generated/prisma/client.js";

function sanitizeUser(user: PrismaUser): Omit<PrismaUser, "sessions" | "accounts" | "pendingChanges"> {
  const { id, name, email, emailVerified, image, role, adminRequestedAt, createdAt, updatedAt } = user;
  return { id, name, email, emailVerified, image, role, adminRequestedAt, createdAt, updatedAt };
}

function sanitizeUsers(
  users: PrismaUser[] = [],
): Omit<PrismaUser, "sessions" | "accounts" | "pendingChanges">[] {
  return users.map((user) => sanitizeUser(user));
}

export { sanitizeUser, sanitizeUsers };
