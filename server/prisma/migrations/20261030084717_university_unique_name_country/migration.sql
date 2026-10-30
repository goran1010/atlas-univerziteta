/*
  Warnings:

  - A unique constraint covering the columns `[name,country]` on the table `university` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "university_name_city_key";

-- DropIndex
DROP INDEX "university_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "university_name_country_key" ON "university"("name", "country");
