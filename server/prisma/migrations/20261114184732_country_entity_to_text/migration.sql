-- Converted in place so every row keeps its value; the SQL Prisma generates
-- for this change drops and re-adds the columns.
ALTER TABLE "university"
  ALTER COLUMN "country" SET DATA TYPE TEXT,
  ALTER COLUMN "entity" SET DATA TYPE TEXT;

DROP TYPE "country";

DROP TYPE "entity";
