import type { User as PrismaUser } from "../generated/prisma/client.js";

function sanitizeUser(user: PrismaUser): Omit<PrismaUser, "password"> {
  const { id, role, email, githubId, googleId, adminRequestedAt } = user;
  return { id, role, email, githubId, googleId, adminRequestedAt };
}

function sanitizeUsers(
  users: PrismaUser[] = [],
): Omit<PrismaUser, "password">[] {
  return users.map((user) => sanitizeUser(user));
}

export { sanitizeUser, sanitizeUsers };
