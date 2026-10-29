-- CreateEnum
CREATE TYPE "country" AS ENUM ('BIH', 'SRB', 'HRV', 'MNE');

-- AlterTable: add country as nullable, backfill, then make required
ALTER TABLE "university" ADD COLUMN "country" "country";
UPDATE "university" SET "country" = 'BIH' WHERE "country" IS NULL;
ALTER TABLE "university" ALTER COLUMN "country" SET NOT NULL;

-- AlterTable: make entity optional
ALTER TABLE "university" ALTER COLUMN "entity" DROP NOT NULL;
