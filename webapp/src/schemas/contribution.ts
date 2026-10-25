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
    data: universityCreateDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("FACULTY"),
    typeOfChange: z.literal("CREATE"),
    parentId: positiveIdSchema,
    data: facultyCreateDataSchema,
    comment: commentSchema,
  }),
  z.object({
    targetType: z.literal("STUDY_PROGRAM"),
    typeOfChange: z.literal("CREATE"),
    parentId: positiveIdSchema,
    data: studyProgramCreateDataSchema,
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
  facultyCreateDataSchema,
  facultyEditDataSchema,
  studyProgramCreateDataSchema,
  studyProgramEditDataSchema,
  trackCreateDataSchema,
  trackEditDataSchema,
  universityCreateDataSchema,
  universityEditDataSchema,
};
