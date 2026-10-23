-- Folded search columns: diacritic-free lowercase copies of the searchable
-- text fields, so search runs one `contains` per field instead of expanding
-- every word into up to 64 diacritic variants.
--
-- All folding happens in app code (foldSearchText in src/utils/searchText.ts,
-- applied in src/models/pendingChangeInputs.ts and src/db/seed.ts); this
-- migration only adds the columns. Existing rows are folded by running
-- db:refold once after deploying (node dist/db/refold.js in the container).
--
-- DEFAULT '' keeps the columns optional in Prisma's create inputs; writers
-- that feed search must set them explicitly.

ALTER TABLE "university"
  ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchCity" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchAcronym" TEXT;

ALTER TABLE "faculty"
  ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchCity" TEXT;

ALTER TABLE "study_program"
  ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchLanguage" TEXT;

ALTER TABLE "track"
  ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '';
