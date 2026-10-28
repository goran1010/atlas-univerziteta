/*
  Warnings:

  - Added the required column `country` to the `university` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "country" AS ENUM ('BIH', 'SRB', 'HRV', 'MNE');

-- AlterTable
ALTER TABLE "university" ADD COLUMN     "country" "country" NOT NULL,
ALTER COLUMN "entity" DROP NOT NULL;
