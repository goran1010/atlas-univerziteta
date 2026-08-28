import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

import type { UniversityCreateManyInput } from "../generated/prisma/models.js";

const __dirname = import.meta.dirname;

const connectionString =
  env.NODE_ENV === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database URL not found in environment variables.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const universitiesFilePath = path.resolve(
  __dirname,
  "../../JSON_files/universities.json",
);

const facultiesFilePath = path.resolve(
  __dirname,
  "../../JSON_files/faculties.json",
);

const studyProgramsFilePath = path.resolve(
  __dirname,
  "../../JSON_files/studyPrograms.json",
);

const universitiesJsonData = fs.readFileSync(universitiesFilePath, "utf-8");

const facultiesJsonData = fs.readFileSync(facultiesFilePath, "utf-8");

const studyProgramsJsonData = fs.readFileSync(studyProgramsFilePath, "utf-8");

const optionalTextSchema = z.string().trim().min(1).nullish();

const optionalDateSchema = z.iso
  .date()
  .transform((value) => new Date(value))
  .nullish();

const universitySeedSchema = z.strictObject({
  name: z.string().trim().min(1),
  acronym: optionalTextSchema,
  city: z.string().trim().min(1),
  entity: z.enum(["FBIH", "RS", "BD"]),
  ownership: z
    .enum(["Javna", "Privatna"])
    .transform((value) => (value === "Javna" ? "JAVNA" : "PRIVATNA")),
  foundedYear: optionalTextSchema,
  website: optionalTextSchema,
  accreditationFrom: optionalDateSchema,
  accreditationTo: optionalDateSchema,
  authority: optionalTextSchema,
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
});

const universitiesSeedSchema = z.array(universitySeedSchema);

const facultySeedSchema = z.strictObject({
  name: z.string().trim().min(1),
  city: optionalTextSchema,
  website: optionalTextSchema,
  isUniversityLevel: z.boolean().optional(),
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
});

const facultyGroupSeedSchema = z.strictObject({
  university: z.string().trim().min(1),
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
  faculties: z.array(facultySeedSchema).min(1),
});

const facultiesSeedSchema = z.array(facultyGroupSeedSchema);

const trackSeedSchema = z.strictObject({
  name: z.string().trim().min(1),
  ects: z.number().int().positive().nullish(),
  durationYears: z.number().int().positive().nullish(),
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
});

const studyProgramSeedSchema = z.strictObject({
  name: z.string().trim().min(1),
  cycle: z.enum([
    "PRVI",
    "DRUGI",
    "TRECI",
    "INTEGRISANI",
    "STRUCNI",
    "SPECIJALISTICKI",
  ]),
  durationYears: z.number().int().positive().nullish(),
  ects: z.number().int().positive().nullish(),
  language: optionalTextSchema,
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
  tracks: z.array(trackSeedSchema).min(1).optional(),
});

const studyProgramFacultySeedSchema = z.strictObject({
  faculty: z.string().trim().min(1),
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
  studyPrograms: z.array(studyProgramSeedSchema).min(1),
});

const studyProgramGroupSeedSchema = z.strictObject({
  university: z.string().trim().min(1),
  faculties: z.array(studyProgramFacultySeedSchema).min(1),
});

const studyProgramsSeedSchema = z.array(studyProgramGroupSeedSchema);

function toUniversityData(
  university: z.infer<typeof universitySeedSchema>,
): UniversityCreateManyInput {
  return {
    name: university.name,
    acronym: university.acronym ?? null,
    city: university.city,
    entity: university.entity,
    ownership: university.ownership,
    foundedYear: university.foundedYear ?? null,
    website: university.website ?? null,
    accreditationFrom: university.accreditationFrom ?? null,
    accreditationTo: university.accreditationTo ?? null,
    authority: university.authority ?? null,
    sourceUrl: university.sourceUrl ?? null,
    lastChecked: university.lastChecked ?? null,
  };
}

async function main() {
  try {
    // eslint-disable-next-line no-console
    console.log("Seeding universities...");

    const rawUniversities = JSON.parse(universitiesJsonData) as unknown;

    const universities = universitiesSeedSchema
      .parse(rawUniversities)
      .map(toUniversityData);

    const upsertedUniversities = await Promise.all(
      universities.map((data) =>
        prisma.university.upsert({
          where: { name: data.name },
          create: data,
          update: data,
        }),
      ),
    );

    // eslint-disable-next-line no-console
    console.log(
      `Upserted ${upsertedUniversities.length.toString()} universities.`,
    );

    // eslint-disable-next-line no-console
    console.log("Seeding faculties...");

    const rawFaculties = JSON.parse(facultiesJsonData) as unknown;

    const facultyGroups = facultiesSeedSchema.parse(rawFaculties);

    const universityIdByName = new Map(
      upsertedUniversities.map((university) => [
        university.name,
        university.id,
      ]),
    );

    const unknownUniversities = facultyGroups
      .map((group) => group.university)
      .filter((name) => !universityIdByName.has(name));

    if (unknownUniversities.length > 0) {
      throw new Error(
        `Unknown universities in faculties.json: ${unknownUniversities.join(", ")}`,
      );
    }

    const facultyUpserts = facultyGroups.flatMap((group) => {
      const universityId = universityIdByName.get(group.university);

      if (universityId === undefined) {
        throw new Error(
          `Unknown university in faculties.json: ${group.university}`,
        );
      }

      return group.faculties.map((faculty) => {
        const sourceUrl = faculty.sourceUrl ?? group.sourceUrl ?? null;
        const lastChecked = faculty.lastChecked ?? group.lastChecked ?? null;
        const isUniversityLevel = faculty.isUniversityLevel ?? false;

        return prisma.faculty.upsert({
          where: {
            name_universityId: { name: faculty.name, universityId },
          },
          create: {
            name: faculty.name,
            universityId,
            city: faculty.city ?? null,
            website: faculty.website ?? null,
            isUniversityLevel,
            sourceUrl,
            lastChecked,
          },
          update: {
            city: faculty.city ?? null,
            website: faculty.website ?? null,
            isUniversityLevel,
            sourceUrl,
            lastChecked,
          },
        });
      });
    });

    const upsertedFaculties = await Promise.all(facultyUpserts);

    // eslint-disable-next-line no-console
    console.log(`Upserted ${upsertedFaculties.length.toString()} faculties.`);

    // eslint-disable-next-line no-console
    console.log("Seeding study programs...");

    const rawStudyPrograms = JSON.parse(studyProgramsJsonData) as unknown;

    const studyProgramGroups = studyProgramsSeedSchema.parse(rawStudyPrograms);

    const facultyIdByUniversityAndName = new Map(
      upsertedFaculties.map((faculty) => [
        `${faculty.universityId.toString()}:${faculty.name}`,
        faculty.id,
      ]),
    );

    const unknownStudyProgramUniversities = studyProgramGroups
      .map((group) => group.university)
      .filter((name) => !universityIdByName.has(name));

    if (unknownStudyProgramUniversities.length > 0) {
      throw new Error(
        `Unknown universities in studyPrograms.json: ${unknownStudyProgramUniversities.join(", ")}`,
      );
    }

    const unknownStudyProgramFaculties = studyProgramGroups.flatMap((group) => {
      const universityId = universityIdByName.get(group.university);

      if (universityId === undefined) {
        return [];
      }

      return group.faculties
        .map((facultyGroup) => facultyGroup.faculty)
        .filter(
          (facultyName) =>
            !facultyIdByUniversityAndName.has(
              `${universityId.toString()}:${facultyName}`,
            ),
        )
        .map((facultyName) => `${facultyName} (${group.university})`);
    });

    if (unknownStudyProgramFaculties.length > 0) {
      throw new Error(
        `Unknown faculties in studyPrograms.json: ${unknownStudyProgramFaculties.join(", ")}`,
      );
    }

    const studyProgramUpserts = studyProgramGroups.flatMap((group) => {
      const universityId = universityIdByName.get(group.university);

      if (universityId === undefined) {
        throw new Error(
          `Unknown university in studyPrograms.json: ${group.university}`,
        );
      }

      return group.faculties.flatMap((facultyGroup) => {
        const facultyId = facultyIdByUniversityAndName.get(
          `${universityId.toString()}:${facultyGroup.faculty}`,
        );

        if (facultyId === undefined) {
          throw new Error(
            `Unknown faculty in studyPrograms.json: ${facultyGroup.faculty} (${group.university})`,
          );
        }

        return facultyGroup.studyPrograms.map((program) => {
          const sourceUrl = program.sourceUrl ?? facultyGroup.sourceUrl ?? null;
          const lastChecked =
            program.lastChecked ?? facultyGroup.lastChecked ?? null;

          return prisma.studyProgram.upsert({
            where: {
              name_facultyId_cycle: {
                name: program.name,
                facultyId,
                cycle: program.cycle,
              },
            },
            create: {
              name: program.name,
              facultyId,
              cycle: program.cycle,
              durationYears: program.durationYears ?? null,
              ects: program.ects ?? null,
              language: program.language ?? null,
              sourceUrl,
              lastChecked,
            },
            update: {
              durationYears: program.durationYears ?? null,
              ects: program.ects ?? null,
              language: program.language ?? null,
              sourceUrl,
              lastChecked,
            },
          });
        });
      });
    });

    const upsertedStudyPrograms = await Promise.all(studyProgramUpserts);

    // eslint-disable-next-line no-console
    console.log(
      `Upserted ${upsertedStudyPrograms.length.toString()} study programs.`,
    );

    // eslint-disable-next-line no-console
    console.log("Seeding tracks...");

    const tracksByProgramKey = new Map(
      studyProgramGroups.flatMap((group) => {
        const universityId = universityIdByName.get(group.university);

        if (universityId === undefined) {
          return [];
        }

        return group.faculties.flatMap((facultyGroup) => {
          const facultyId = facultyIdByUniversityAndName.get(
            `${universityId.toString()}:${facultyGroup.faculty}`,
          );

          if (facultyId === undefined) {
            return [];
          }

          return facultyGroup.studyPrograms
            .filter((program) => program.tracks !== undefined)
            .map(
              (program) =>
                [
                  `${facultyId.toString()}:${program.name}:${program.cycle}`,
                  program.tracks ?? [],
                ] as const,
            );
        });
      }),
    );

    const trackUpserts = upsertedStudyPrograms.flatMap((studyProgram) => {
      const tracks =
        tracksByProgramKey.get(
          `${studyProgram.facultyId.toString()}:${studyProgram.name}:${studyProgram.cycle}`,
        ) ?? [];

      return tracks.map((track) =>
        prisma.track.upsert({
          where: {
            name_studyProgramId: {
              name: track.name,
              studyProgramId: studyProgram.id,
            },
          },
          create: {
            name: track.name,
            studyProgramId: studyProgram.id,
            ects: track.ects ?? null,
            durationYears: track.durationYears ?? null,
            sourceUrl: track.sourceUrl ?? null,
            lastChecked: track.lastChecked ?? null,
          },
          update: {
            ects: track.ects ?? null,
            durationYears: track.durationYears ?? null,
            sourceUrl: track.sourceUrl ?? null,
            lastChecked: track.lastChecked ?? null,
          },
        }),
      );
    });

    const upsertedTracks = await Promise.all(trackUpserts);

    // eslint-disable-next-line no-console
    console.log(`Upserted ${upsertedTracks.length.toString()} tracks.`);
  } catch (error: unknown) {
    console.error("Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
