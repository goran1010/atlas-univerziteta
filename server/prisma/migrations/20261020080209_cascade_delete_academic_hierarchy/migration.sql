-- DropForeignKey
ALTER TABLE "faculty" DROP CONSTRAINT "faculties_universityId_fkey";

-- DropForeignKey
ALTER TABLE "study_program" DROP CONSTRAINT "study_programs_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "track" DROP CONSTRAINT "tracks_studyProgramId_fkey";

-- AlterTable
ALTER TABLE "faculty" RENAME CONSTRAINT "faculties_pkey" TO "faculty_pkey";

-- AlterTable
ALTER TABLE "pending_change" RENAME CONSTRAINT "pending_changes_pkey" TO "pending_change_pkey";

-- AlterTable
ALTER TABLE "study_program" RENAME CONSTRAINT "study_programs_pkey" TO "study_program_pkey";

-- AlterTable
ALTER TABLE "track" RENAME CONSTRAINT "tracks_pkey" TO "track_pkey";

-- AlterTable
ALTER TABLE "university" RENAME CONSTRAINT "universities_pkey" TO "university_pkey";

-- RenameForeignKey
ALTER TABLE "pending_change" RENAME CONSTRAINT "pending_changes_userId_fkey" TO "pending_change_userId_fkey";

-- AddForeignKey
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "university"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_program" ADD CONSTRAINT "study_program_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track" ADD CONSTRAINT "track_studyProgramId_fkey" FOREIGN KEY ("studyProgramId") REFERENCES "study_program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "faculties_name_universityId_key" RENAME TO "faculty_name_universityId_key";

-- RenameIndex
ALTER INDEX "pending_changes_createdAt_idx" RENAME TO "pending_change_createdAt_idx";

-- RenameIndex
ALTER INDEX "pending_changes_entityType_typeOfChange_idx" RENAME TO "pending_change_entityType_typeOfChange_idx";

-- RenameIndex
ALTER INDEX "pending_changes_parentId_idx" RENAME TO "pending_change_parentId_idx";

-- RenameIndex
ALTER INDEX "pending_changes_targetId_idx" RENAME TO "pending_change_targetId_idx";

-- RenameIndex
ALTER INDEX "pending_changes_userId_idx" RENAME TO "pending_change_userId_idx";

-- RenameIndex
ALTER INDEX "study_programs_name_facultyId_cycle_key" RENAME TO "study_program_name_facultyId_cycle_key";

-- RenameIndex
ALTER INDEX "tracks_name_studyProgramId_key" RENAME TO "track_name_studyProgramId_key";

-- RenameIndex
ALTER INDEX "universities_name_city_key" RENAME TO "university_name_city_key";

-- RenameIndex
ALTER INDEX "universities_name_key" RENAME TO "university_name_key";
