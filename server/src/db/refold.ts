/* eslint-disable no-console -- CLI maintenance script: console output is its interface */
import { prisma } from "./prisma.js";
import { foldSearchText, foldSearchTextOrNull } from "../utils/searchText.js";

// Rewrites every row's folded search* columns from its source fields. App
// writes keep the columns in sync (pendingChangeInputs.ts, seed.ts); run
// this after editing entities with manual SQL, or once after changing the
// fold rules in searchText.ts.
async function main() {
  try {
    const universities = await prisma.university.findMany();
    for (const university of universities) {
      await prisma.university.update({
        where: { id: university.id },
        data: {
          searchName: foldSearchText(university.name),
          searchCity: foldSearchText(university.city),
          searchAcronym: foldSearchTextOrNull(university.acronym),
        },
      });
    }
    console.log(`Refolded ${universities.length.toString()} universities.`);

    const faculties = await prisma.faculty.findMany();
    for (const faculty of faculties) {
      await prisma.faculty.update({
        where: { id: faculty.id },
        data: {
          searchName: foldSearchText(faculty.name),
          searchCity: foldSearchTextOrNull(faculty.city),
        },
      });
    }
    console.log(`Refolded ${faculties.length.toString()} faculties.`);

    const studyPrograms = await prisma.studyProgram.findMany();
    for (const studyProgram of studyPrograms) {
      await prisma.studyProgram.update({
        where: { id: studyProgram.id },
        data: {
          searchName: foldSearchText(studyProgram.name),
          searchLanguage: foldSearchTextOrNull(studyProgram.language),
        },
      });
    }
    console.log(`Refolded ${studyPrograms.length.toString()} study programs.`);

    const tracks = await prisma.track.findMany();
    for (const track of tracks) {
      await prisma.track.update({
        where: { id: track.id },
        data: { searchName: foldSearchText(track.name) },
      });
    }
    console.log(`Refolded ${tracks.length.toString()} tracks.`);
  } catch (error: unknown) {
    console.error("Error refolding search columns:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
