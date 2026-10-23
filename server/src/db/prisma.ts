import "dotenv/config.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const connectionString =
  process.env["NODE_ENV"] === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

// The folded search* columns are internal (see src/search/fields.ts) and
// must not leak into API responses, so every read omits them by default.
const prisma = new PrismaClient({
  adapter,
  omit: {
    university: { searchName: true, searchCity: true, searchAcronym: true },
    faculty: { searchName: true, searchCity: true },
    studyProgram: { searchName: true, searchLanguage: true },
    track: { searchName: true },
  },
});

export { prisma };
