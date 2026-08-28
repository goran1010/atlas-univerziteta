-- AlterEnum
ALTER TYPE "studyCycle" ADD VALUE 'SPECIJALISTICKI';

-- AlterTable
ALTER TABLE "faculties" ADD COLUMN     "isUniversityLevel" BOOLEAN NOT NULL DEFAULT false;
