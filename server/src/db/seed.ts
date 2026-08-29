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

const universitiesDirPath = path.resolve(
  __dirname,
  "../../JSON_files/universities",
);

const universityFileNames = fs
  .readdirSync(universitiesDirPath)
  .filter((fileName) => fileName.endsWith(".json"))
  .sort();

const optionalTextSchema = z.string().trim().min(1).nullish();

const optionalDateSchema = z.iso
  .date()
  .transform((value) => new Date(value))
  .nullish();

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
    "FIRST",
    "SECOND",
    "THIRD",
    "INTEGRATED",
    "VOCATIONAL",
    "SPECIALIST",
  ]),
  durationYears: z.number().int().positive().nullish(),
  ects: z.number().int().positive().nullish(),
  language: optionalTextSchema,
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
  tracks: z.array(trackSeedSchema).min(1).optional(),
});

const facultySeedSchema = z.strictObject({
  name: z.string().trim().min(1),
  city: optionalTextSchema,
  website: optionalTextSchema,
  address: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalTextSchema,
  isUniversityLevel: z.boolean().optional(),
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
  studyProgramsSourceUrl: optionalTextSchema,
  studyProgramsLastChecked: optionalDateSchema,
  studyPrograms: z.array(studyProgramSeedSchema).min(1).optional(),
});

const universitySeedSchema = z.strictObject({
  name: z.string().trim().min(1),
  acronym: optionalTextSchema,
  city: z.string().trim().min(1),
  entity: z.enum(["FBIH", "RS", "BD"]),
  ownership: z.enum(["PUBLIC", "PRIVATE"]),
  foundedYear: optionalTextSchema,
  website: optionalTextSchema,
  address: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalTextSchema,
  accreditationFrom: optionalDateSchema,
  accreditationTo: optionalDateSchema,
  authority: optionalTextSchema,
  sourceUrl: optionalTextSchema,
  lastChecked: optionalDateSchema,
  facultiesSourceUrl: optionalTextSchema,
  facultiesLastChecked: optionalDateSchema,
  faculties: z.array(facultySeedSchema).min(1),
});

type UniversitySeed = z.infer<typeof universitySeedSchema>;

function parseUniversityFile(fileName: string): UniversitySeed {
  const jsonData = fs.readFileSync(
    path.join(universitiesDirPath, fileName),
    "utf-8",
  );

  const raw = JSON.parse(jsonData) as unknown;

  try {
    return universitySeedSchema.parse(raw);
  } catch (error) {
    throw new Error(`Invalid university seed file: ${fileName}`, {
      cause: error,
    });
  }
}

function toUniversityData(
  university: UniversitySeed,
): UniversityCreateManyInput {
  return {
    name: university.name,
    acronym: university.acronym ?? null,
    city: university.city,
    entity: university.entity,
    ownership: university.ownership,
    foundedYear: university.foundedYear ?? null,
    website: university.website ?? null,
    address: university.address ?? null,
    phone: university.phone ?? null,
    email: university.email ?? null,
    accreditationFrom: university.accreditationFrom ?? null,
    accreditationTo: university.accreditationTo ?? null,
    authority: university.authority ?? null,
    sourceUrl: university.sourceUrl ?? null,
    lastChecked: university.lastChecked ?? null,
  };
}

async function main() {
  try {
    const universityTrees = universityFileNames.map(parseUniversityFile);

    // eslint-disable-next-line no-console
    console.log("Seeding universities...");

    const upsertedUniversities = await Promise.all(
      universityTrees.map(toUniversityData).map((data) =>
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

    const universityIdByName = new Map(
      upsertedUniversities.map((university) => [
        university.name,
        university.id,
      ]),
    );

    const facultyUpserts = universityTrees.flatMap((tree) => {
      const universityId = universityIdByName.get(tree.name);

      if (universityId === undefined) {
        throw new Error(`Unknown university: ${tree.name}`);
      }

      return tree.faculties.map((faculty) => {
        const sourceUrl = faculty.sourceUrl ?? tree.facultiesSourceUrl ?? null;
        const lastChecked =
          faculty.lastChecked ?? tree.facultiesLastChecked ?? null;
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
            address: faculty.address ?? null,
            phone: faculty.phone ?? null,
            email: faculty.email ?? null,
            isUniversityLevel,
            sourceUrl,
            lastChecked,
          },
          update: {
            city: faculty.city ?? null,
            website: faculty.website ?? null,
            address: faculty.address ?? null,
            phone: faculty.phone ?? null,
            email: faculty.email ?? null,
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

    const facultyIdByUniversityAndName = new Map(
      upsertedFaculties.map((faculty) => [
        `${faculty.universityId.toString()}:${faculty.name}`,
        faculty.id,
      ]),
    );

    const studyProgramUpserts = universityTrees.flatMap((tree) => {
      const universityId = universityIdByName.get(tree.name);

      if (universityId === undefined) {
        throw new Error(`Unknown university: ${tree.name}`);
      }

      return tree.faculties.flatMap((faculty) => {
        const facultyId = facultyIdByUniversityAndName.get(
          `${universityId.toString()}:${faculty.name}`,
        );

        if (facultyId === undefined) {
          throw new Error(`Unknown faculty: ${faculty.name} (${tree.name})`);
        }

        return (faculty.studyPrograms ?? []).map((program) => {
          const sourceUrl =
            program.sourceUrl ?? faculty.studyProgramsSourceUrl ?? null;
          const lastChecked =
            program.lastChecked ?? faculty.studyProgramsLastChecked ?? null;

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
      universityTrees.flatMap((tree) => {
        const universityId = universityIdByName.get(tree.name);

        if (universityId === undefined) {
          return [];
        }

        return tree.faculties.flatMap((faculty) => {
          const facultyId = facultyIdByUniversityAndName.get(
            `${universityId.toString()}:${faculty.name}`,
          );

          if (facultyId === undefined) {
            return [];
          }

          return (faculty.studyPrograms ?? [])
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
