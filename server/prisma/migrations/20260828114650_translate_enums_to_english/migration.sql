-- Translate ownership enum values to English (data-preserving renames)
ALTER TYPE "ownership" RENAME VALUE 'JAVNA' TO 'PUBLIC';
ALTER TYPE "ownership" RENAME VALUE 'PRIVATNA' TO 'PRIVATE';

-- Translate studyCycle enum values to English (data-preserving renames)
ALTER TYPE "studyCycle" RENAME VALUE 'PRVI' TO 'FIRST';
ALTER TYPE "studyCycle" RENAME VALUE 'DRUGI' TO 'SECOND';
ALTER TYPE "studyCycle" RENAME VALUE 'TRECI' TO 'THIRD';
ALTER TYPE "studyCycle" RENAME VALUE 'INTEGRISANI' TO 'INTEGRATED';
ALTER TYPE "studyCycle" RENAME VALUE 'STRUCNI' TO 'VOCATIONAL';
ALTER TYPE "studyCycle" RENAME VALUE 'SPECIJALISTICKI' TO 'SPECIALIST';

-- Translate subjectType enum values to English (data-preserving renames)
ALTER TYPE "subjectType" RENAME VALUE 'OBAVEZNI' TO 'MANDATORY';
ALTER TYPE "subjectType" RENAME VALUE 'IZBORNI' TO 'ELECTIVE';

-- Remap enum values stored inside pending_changes proposed-data JSON blobs
UPDATE "pending_changes"
SET "data" = jsonb_set(
  "data",
  '{ownership}',
  CASE "data"->>'ownership'
    WHEN 'JAVNA' THEN '"PUBLIC"'::jsonb
    WHEN 'PRIVATNA' THEN '"PRIVATE"'::jsonb
  END
)
WHERE "data" ? 'ownership'
  AND "data"->>'ownership' IN ('JAVNA', 'PRIVATNA');

UPDATE "pending_changes"
SET "data" = jsonb_set(
  "data",
  '{cycle}',
  CASE "data"->>'cycle'
    WHEN 'PRVI' THEN '"FIRST"'::jsonb
    WHEN 'DRUGI' THEN '"SECOND"'::jsonb
    WHEN 'TRECI' THEN '"THIRD"'::jsonb
    WHEN 'INTEGRISANI' THEN '"INTEGRATED"'::jsonb
    WHEN 'STRUCNI' THEN '"VOCATIONAL"'::jsonb
    WHEN 'SPECIJALISTICKI' THEN '"SPECIALIST"'::jsonb
  END
)
WHERE "data" ? 'cycle'
  AND "data"->>'cycle' IN ('PRVI', 'DRUGI', 'TRECI', 'INTEGRISANI', 'STRUCNI', 'SPECIJALISTICKI');

UPDATE "pending_changes"
SET "data" = jsonb_set(
  "data",
  '{type}',
  CASE "data"->>'type'
    WHEN 'OBAVEZNI' THEN '"MANDATORY"'::jsonb
    WHEN 'IZBORNI' THEN '"ELECTIVE"'::jsonb
  END
)
WHERE "data" ? 'type'
  AND "data"->>'type' IN ('OBAVEZNI', 'IZBORNI');
