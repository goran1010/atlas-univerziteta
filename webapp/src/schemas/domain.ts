import { z } from "zod";

const entityTypeSchema = z.enum([
  "UNIVERSITY",
  "FACULTY",
  "STUDY_PROGRAM",
  "SUBJECT",
  "TRACK",
]);
const entitySchema = z.enum(["FBIH", "RS", "BD"]);
const ownershipSchema = z.enum(["JAVNA", "PRIVATNA"]);
const studyCycleSchema = z.enum([
  "PRVI",
  "DRUGI",
  "TRECI",
  "INTEGRISANI",
  "STRUCNI",
  "SPECIJALISTICKI",
]);
const subjectTypeSchema = z.enum(["OBAVEZNI", "IZBORNI"]);
const userRoleSchema = z.enum(["ADMIN", "USER"]);

const integerSchema = z.number().int();
const positiveIntegerSchema = integerSchema.positive();
const durationYearsSchema = integerSchema.min(1).max(10);
const ectsSchema = positiveIntegerSchema;
const semesterSchema = integerSchema.min(1).max(12);
const searchTermSchema = z
  .string()
  .trim()
  .min(2, { error: "validation.search.minLength" })
  .max(100, { error: "validation.search.maxLength" });

export {
  durationYearsSchema,
  ectsSchema,
  entitySchema,
  entityTypeSchema,
  integerSchema,
  ownershipSchema,
  positiveIntegerSchema,
  semesterSchema,
  searchTermSchema,
  studyCycleSchema,
  subjectTypeSchema,
  userRoleSchema,
};
