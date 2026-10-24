-- Rename, not drop-and-recreate: pending_change rows must survive. Prisma's
-- generated diff for an enum + column rename is destructive, hence this
-- hand-written migration (known repo gotcha).
ALTER TYPE "entityType" RENAME TO "targetType";

ALTER TABLE "pending_change" RENAME COLUMN "entityType" TO "targetType";

ALTER INDEX "pending_change_entityType_typeOfChange_idx"
  RENAME TO "pending_change_targetType_typeOfChange_idx";
