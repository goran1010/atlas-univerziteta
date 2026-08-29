-- Remove Subjects from the project (Track is the smallest tracked unit)

-- Guard: drop any pending contributions targeting subjects
DELETE FROM "pending_changes" WHERE "entityType" = 'SUBJECT';

-- Recreate entityType enum without SUBJECT (PG cannot drop an enum value)
CREATE TYPE "entityType_new" AS ENUM ('UNIVERSITY', 'FACULTY', 'STUDY_PROGRAM', 'TRACK');
ALTER TABLE "pending_changes" ALTER COLUMN "entityType" TYPE "entityType_new" USING ("entityType"::text::"entityType_new");
ALTER TYPE "entityType" RENAME TO "entityType_old";
ALTER TYPE "entityType_new" RENAME TO "entityType";
DROP TYPE "entityType_old";

-- Drop the subjects table and its enum
DROP TABLE "subjects";
DROP TYPE "subjectType";
