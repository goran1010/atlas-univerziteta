-- Rename, not drop/add: the provenance data survives in place.
ALTER TABLE "university" RENAME COLUMN "sourceUrl" TO "dataSourceUrl";
ALTER TABLE "faculty" RENAME COLUMN "sourceUrl" TO "dataSourceUrl";
ALTER TABLE "study_program" RENAME COLUMN "sourceUrl" TO "dataSourceUrl";
ALTER TABLE "track" RENAME COLUMN "sourceUrl" TO "dataSourceUrl";
