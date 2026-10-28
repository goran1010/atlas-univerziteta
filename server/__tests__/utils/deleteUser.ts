import { prisma } from "../../src/db/prisma.js";

// sessions, accounts, and pending changes cascade with the user row
async function deleteUser(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}

export { deleteUser };
