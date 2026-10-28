import { z } from "zod";

import {
  durationYearsSchema,
  ectsSchema,
  entitySchema,
  targetTypeSchema,
  ownershipSchema,
  positiveIntegerSchema,
  studyCycleSchema,
} from "./domain";

// Length caps mirror server/src/validation/contributionValidation.ts
const requiredNameSchema = z.string().trim().min(1).max(200);
const optionalNameSchema = requiredNameSchema.optional();
const acronymSchema = z.string().trim().min(1).max(20);
const foundedYearSchema = z.string().trim().min(1).max(20);
const addressSchema = z.string().trim().min(1).max(300);
const phoneSchema = z.string().trim().min(1).max(50);
const languageSchema = z.string().trim().min(1).max(100);
const emailSchema = z.email().max(254);

// http(s) only - bare z.url() accepts javascript: and data: URLs
const websiteSchema = z.url({ protocol: /^https?$/ }).max(254);

const commentSchema = z.string().trim().min(1).max(1000).optional();

const universityCreateDataSchema = z.strictObject({
  name: requiredNameSchema,
  city: requiredNameSchema,
  entity: entitySchema,
  ownership: ownershipSchema,
  acronym: acronymSchema.optional(),
  foundedYear: foundedYearSchema.optional(),
  website: websiteSchema.optional(),
  address: addressSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

const facultyCreateDataSchema = z.strictObject({
  name: requiredNameSchema,
  city: requiredNameSchema.optional(),
  website: websiteSchema.optional(),
  address: addressSchema.optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

const studyProgramCreateDataSchema = z.strictObject({
  name: requiredNameSchema,
  cycle: studyCycleSchema,
  durationYears: durationYearsSchema.optional(),
  ects: ectsSchema.optional(),
  language: languageSchema.optional(),
});

function nonEmptyObject<T extends z.ZodRawShape>(shape: T) {
  return z.strictObject(shape).refine((data) => Object.keys(data).length > 0);
}

const universityEditDataSchema = nonEmptyObject({
  name: optionalNameSchema,
  city: optionalNameSchema,
  entity: entitySchema.optional(),
  ownership: ownershipSchema.optional(),
  acronym: acronymSchema.nullable().optional(),
  foundedYear: foundedYearSchema.nullable().optional(),
  website: websiteSchema.nullable().optional(),
  address: addressSchema.nullable().optional(),
  phone: phoneSchema.nullable().optional(),
  email: emailSchema.nullable().optional(),
});

const facultyEditDataSchema = nonEmptyObject({
  name: optionalNameSchema,
  city: requiredNameSchema.nullable().optional(),
  website: websiteSchema.nullable().optional(),
  address: addressSchema.nullable().optional(),
  phone: phoneSchema.nullable().optional(),
  email: emailSchema.nullable().optional(),
});

const studyProgramEditDataSchema = nonEmptyObject({
  name: optionalNameSchema,
  cycle: studyCycleSchema.optional(),
  durationYears: durationYearsSchema.nullable().optional(),
  ects: ectsSchema.nullable().optional(),
  language: languageSchema.nullable().optional(),
});

const trackCreateDataSchema = z.strictObject({
  name: requiredNameSchema,
  ects: ectsSchema.optional(),
  durationYears: durationYearsSchema.optional(),
});

const trackEditDataSchema = nonEmptyObject({
  name: optionalNameSchema,
  ects: ectsSchema.nullable().optional(),
  durationYears: durationYearsSchema.nullable().optional(),
});

// Tree creates mirror server/src/validation/contributionValidation.ts: a
// CREATE may nest children in the seed JSON structure (faculties >
// studyPrograms > tracks), sibling duplicates are rejected, and any subtree
// is capped at MAX_TREE_NODES items.
const MAX_TREE_NODES = 800;

const treeTooLargeError = `A tree submission can contain at most ${String(MAX_TREE_NODES)} items`;

function duplicateIndexes<Item>(
  items: Item[] | undefined,
  keyOf: (item: Item) => string,
): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];
  (items ?? []).forEach((item, index) => {
    const key = keyOf(item);
    if (seen.has(key)) duplicates.push(index);
    seen.add(key);
  });
  return duplicates;
}

function countStudyProgramNodes(program: { tracks?: unknown[] | undefined }) {
  return 1 + (program.tracks?.length ?? 0);
}

function countFacultyNodes(faculty: {
  studyPrograms?: { tracks?: unknown[] | undefined }[] | undefined;
}) {
  let count = 1;
  for (const program of faculty.studyPrograms ?? []) {
    count += countStudyProgramNodes(program);
  }
  return count;
}

function countUniversityNodes(university: {
  faculties?:
    | { studyPrograms?: { tracks?: unknown[] | undefined }[] | undefined }[]
    | undefined;
}) {
  let count = 1;
  for (const faculty of university.faculties ?? []) {
    count += countFacultyNodes(faculty);
  }
  return count;
}

const studyProgramTreeDataSchema = studyProgramCreateDataSchema
  .extend({
    tracks: z.array(trackCreateDataSchema).min(1).optional(),
  })
  .superRefine((program, ctx) => {
    for (const index of duplicateIndexes(
      program.tracks,
      (track) => track.name,
    )) {
      ctx.addIssue({
        code: "custom",
        path: ["tracks", index, "name"],
        message: "Duplicate track name in this study program",
      });
    }

    if (countStudyProgramNodes(program) > MAX_TREE_NODES) {
      ctx.addIssue({ code: "custom", message: treeTooLargeError });
    }
  });

const facultyTreeDataSchema = facultyCreateDataSchema
  .extend({
    studyPrograms: z.array(studyProgramTreeDataSchema).min(1).optional(),
  })
  .superRefine((faculty, ctx) => {
    for (const index of duplicateIndexes(
      faculty.studyPrograms,
      (program) => `${program.cycle}:${program.name}`,
    )) {
      ctx.addIssue({
        code: "custom",
        path: ["studyPrograms", index, "name"],
        message:
          "Duplicate study program (same name and cycle) in this faculty",
      });
    }

    if (countFacultyNodes(faculty) > MAX_TREE_NODES) {
      ctx.addIssue({ code: "custom", message: treeTooLargeError });
    }
  });

const universityTreeDataSchema = universityCreateDataSchema
  .extend({
    faculties: z.array(facultyTreeDataSchema).min(1).optional(),
  })
  .superRefine((university, ctx) => {
    for (const index of duplicateIndexes(
      university.faculties,
      (faculty) => faculty.name,
    )) {
      ctx.addIssue({
        code: "custom",
        path: ["faculties", index, "name"],
        message: "Duplicate faculty name in this university",
      });
    }

    if (countUniversityNodes(university) > MAX_TREE_NODES) {
      ctx.addIssue({ code: "custom", message: treeTooLargeError });
    }
  });

const positiveIdSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(positiveIntegerSchema);

const contributionSubmissionSchema = z.union([
  z.object({
    targetType: z.literal("UNIVERSITY"),
    typeOfChange: z.literal("CREATE"),
    data: universityTreeDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("FACULTY"),
    typeOfChange: z.literal("CREATE"),
    parentId: positiveIdSchema,
    data: facultyTreeDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("STUDY_PROGRAM"),
    typeOfChange: z.literal("CREATE"),
    parentId: positiveIdSchema,
    data: studyProgramTreeDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("TRACK"),
    typeOfChange: z.literal("CREATE"),
    parentId: positiveIdSchema,
    data: trackCreateDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("UNIVERSITY"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIdSchema,
    data: universityEditDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("FACULTY"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIdSchema,
    data: facultyEditDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("STUDY_PROGRAM"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIdSchema,
    data: studyProgramEditDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("TRACK"),
    typeOfChange: z.literal("UPDATE"),
    targetId: positiveIdSchema,
    data: trackEditDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: targetTypeSchema,
    typeOfChange: z.literal("DELETE"),
    targetId: positiveIdSchema,
    comment: commentSchema,
  }),
]);

export {
  contributionSubmissionSchema,
  facultyEditDataSchema,
  facultyTreeDataSchema,
  studyProgramEditDataSchema,
  studyProgramTreeDataSchema,
  trackCreateDataSchema,
  trackEditDataSchema,
  universityCreateDataSchema,
  universityEditDataSchema,
  universityTreeDataSchema,
};

export type TrackCreateData = z.infer<typeof trackCreateDataSchema>;
export type StudyProgramTreeData = z.infer<typeof studyProgramTreeDataSchema>;
export type FacultyTreeData = z.infer<typeof facultyTreeDataSchema>;
export type UniversityTreeData = z.infer<typeof universityTreeDataSchema>;
