-- lastChecked tracked source verification; the field now tracks when a unit
-- was last modified (seed updates and approved user contributions alike)
ALTER TABLE "universities" RENAME COLUMN "lastChecked" TO "lastModified";
ALTER TABLE "faculties" RENAME COLUMN "lastChecked" TO "lastModified";
ALTER TABLE "study_programs" RENAME COLUMN "lastChecked" TO "lastModified";
ALTER TABLE "tracks" RENAME COLUMN "lastChecked" TO "lastModified";
