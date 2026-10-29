/* eslint-disable no-console -- CLI seed script: console output is its interface */
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";

import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";
import {
  universitySearchFields,
  facultySearchFields,
  studyProgramSearchFields,
  trackSearchFields,
} from "../search/fields.js";

import type { UniversityCreateManyInput } from "../generated/prisma/models.js";

const __dirname = import.meta.dirname;

const connectionString =
  env.NODE_ENV === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database URL not found in environment variables.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const baseDir = path.resolve(__dirname, "../../JSON_files/universities");

const universityFilePaths = fs
  .readdirSync(baseDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))
  .flatMap((dir) =>
    fs
      .readdirSync(path.join(baseDir, dir.name))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => path.join(baseDir, dir.name, f)),
  );

const optionalTextSchema = z.string().trim().min(1).nullish();

// a plain URL with no annotations - notes belong next to the data, not in it
const optionalUrlSchema = z
  .string()
  .regex(/^https?:\/\/\S+$/)
  .nullish();

const optionalDateSchema = z.iso
  .date()
  .transform((value) => new Date(value))
  .nullish();

const trackSeedSchema = z.strictObject({
  name: z.string().trim().min(1),
  ects: z.number().int().positive().nullish(),
  durationYears: z.number().int().positive().nullish(),
  dataSourceUrl: optionalUrlSchema,
  lastModified: optionalDateSchema,
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
  dataSourceUrl: optionalUrlSchema,
  lastModified: optionalDateSchema,
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
  dataSourceUrl: optionalUrlSchema,
  lastModified: optionalDateSchema,
  studyPrograms: z.array(studyProgramSeedSchema).min(1).optional(),
});

const universitySeedSchema = z
  .strictObject({
    country: z.enum(["BIH", "SRB", "HRV", "MNE"]),
    name: z.string().trim().min(1),
    acronym: optionalTextSchema,
    city: z.string().trim().min(1),
    entity: z.enum(["FBIH", "RS", "BD"]).optional(),
    ownership: z.enum(["PUBLIC", "PRIVATE"]),
    foundedYear: optionalTextSchema,
    website: optionalTextSchema,
    address: optionalTextSchema,
    phone: optionalTextSchema,
    email: optionalTextSchema,
    accreditationFrom: optionalDateSchema,
    accreditationTo: optionalDateSchema,
    authority: optionalTextSchema,
    dataSourceUrl: optionalUrlSchema,
    lastModified: optionalDateSchema,
    faculties: z.array(facultySeedSchema).min(1).optional(),
  })
  .refine((u) => u.country !== "BIH" || u.entity !== undefined, {
    message: "Entity is required for Bosnian universities",
    path: ["entity"],
  });

type UniversitySeed = z.infer<typeof universitySeedSchema>;

function parseUniversityFile(filePath: string): UniversitySeed {
  const jsonData = fs.readFileSync(filePath, "utf-8");
  const raw: unknown = JSON.parse(jsonData);

  try {
    return universitySeedSchema.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid university seed file: ${path.relative(baseDir, filePath)}`,
      { cause: error },
    );
  }
}

function validateSeedData(
  filePaths: string[],
  trees: UniversitySeed[],
): void {
  const errors: string[] = [];
  const seenNames = new Map<string, string>();

  for (const [i, tree] of trees.entries()) {
    const file = path.relative(baseDir, filePaths[i] ?? "");
    const folder = file.split(path.sep)[0] ?? "";

    if (tree.country !== folder) {
      errors.push(
        `${file}: country "${tree.country}" does not match folder "${folder}"`,
      );
    }

    const existing = seenNames.get(tree.name);
    if (existing) {
      errors.push(
        `Duplicate university name "${tree.name}" in ${file} and ${existing}`,
      );
    }
    seenNames.set(tree.name, file);

    for (const faculty of tree.faculties ?? []) {
      const seenPrograms = new Set<string>();
      for (const program of faculty.studyPrograms ?? []) {
        const key = `${program.name}::${program.cycle}`;
        if (seenPrograms.has(key)) {
          errors.push(
            `${file}: duplicate program "${program.name}" (${program.cycle}) in faculty "${faculty.name}"`,
          );
        }
        seenPrograms.add(key);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Seed validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }
}

function toUniversityData(
  university: UniversitySeed,
): UniversityCreateManyInput {
  return {
    name: university.name,
    acronym: university.acronym ?? null,
    city: university.city,
    ...universitySearchFields({
      name: university.name,
      city: university.city,
      acronym: university.acronym ?? null,
    }),
    country: university.country,
    entity: university.entity ?? null,
    ownership: university.ownership,
    foundedYear: university.foundedYear ?? null,
    website: university.website ?? null,
    address: university.address ?? null,
    phone: university.phone ?? null,
    email: university.email ?? null,
    accreditationFrom: university.accreditationFrom ?? null,
    accreditationTo: university.accreditationTo ?? null,
    authority: university.authority ?? null,
    dataSourceUrl: university.dataSourceUrl ?? null,
    lastModified: university.lastModified ?? null,
  };
}

async function main() {
  try {
    const universityTrees = universityFilePaths.map(parseUniversityFile);
    validateSeedData(universityFilePaths, universityTrees);
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
    console.log(
      `Upserted ${upsertedUniversities.length.toString()} universities.`,
    );
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

      return (tree.faculties ?? []).map((faculty) => {
        const dataSourceUrl = faculty.dataSourceUrl ?? null;
        const lastModified = faculty.lastModified ?? null;
        const isUniversityLevel = faculty.isUniversityLevel ?? false;

        return prisma.faculty.upsert({
          where: {
            name_universityId: { name: faculty.name, universityId },
          },
          create: {
            name: faculty.name,
            universityId,
            city: faculty.city ?? null,
            ...facultySearchFields({
              name: faculty.name,
              city: faculty.city ?? null,
            }),
            website: faculty.website ?? null,
            address: faculty.address ?? null,
            phone: faculty.phone ?? null,
            email: faculty.email ?? null,
            isUniversityLevel,
            dataSourceUrl,
            lastModified,
          },
          update: {
            city: faculty.city ?? null,
            ...facultySearchFields({ city: faculty.city ?? null }),
            website: faculty.website ?? null,
            address: faculty.address ?? null,
            phone: faculty.phone ?? null,
            email: faculty.email ?? null,
            isUniversityLevel,
            dataSourceUrl,
            lastModified,
          },
        });
      });
    });

    const upsertedFaculties = await Promise.all(facultyUpserts);
    console.log(`Upserted ${upsertedFaculties.length.toString()} faculties.`);
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

      return (tree.faculties ?? []).flatMap((faculty) => {
        const facultyId = facultyIdByUniversityAndName.get(
          `${universityId.toString()}:${faculty.name}`,
        );

        if (facultyId === undefined) {
          throw new Error(`Unknown faculty: ${faculty.name} (${tree.name})`);
        }

        return (faculty.studyPrograms ?? []).map((program) => {
          const dataSourceUrl = program.dataSourceUrl ?? null;
          const lastModified = program.lastModified ?? null;

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
              ...studyProgramSearchFields({
                name: program.name,
                language: program.language ?? null,
              }),
              dataSourceUrl,
              lastModified,
            },
            update: {
              durationYears: program.durationYears ?? null,
              ects: program.ects ?? null,
              language: program.language ?? null,
              ...studyProgramSearchFields({
                language: program.language ?? null,
              }),
              dataSourceUrl,
              lastModified,
            },
          });
        });
      });
    });

    const upsertedStudyPrograms = await Promise.all(studyProgramUpserts);
    console.log(
      `Upserted ${upsertedStudyPrograms.length.toString()} study programs.`,
    );
    console.log("Seeding tracks...");

    const tracksByProgramKey = new Map(
      universityTrees.flatMap((tree) => {
        const universityId = universityIdByName.get(tree.name);

        if (universityId === undefined) {
          return [];
        }

        return (tree.faculties ?? []).flatMap((faculty) => {
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
            ...trackSearchFields({ name: track.name }),
            ects: track.ects ?? null,
            durationYears: track.durationYears ?? null,
            // a track's numbers come from its program's document
            dataSourceUrl: track.dataSourceUrl ?? studyProgram.dataSourceUrl,
            lastModified: track.lastModified ?? null,
          },
          update: {
            ects: track.ects ?? null,
            durationYears: track.durationYears ?? null,
            dataSourceUrl: track.dataSourceUrl ?? studyProgram.dataSourceUrl,
            lastModified: track.lastModified ?? null,
          },
        }),
      );
    });

    const upsertedTracks = await Promise.all(trackUpserts);
    console.log(`Upserted ${upsertedTracks.length.toString()} tracks.`);
  } catch (error: unknown) {
    console.error("Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

await main();
