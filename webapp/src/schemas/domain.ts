import { z } from "zod";

const entityTypeSchema = z.enum([
  "UNIVERSITY",
  "FACULTY",
  "STUDY_PROGRAM",
  "TRACK",
]);
const entitySchema = z.enum(["FBIH", "RS", "BD"]);
const ownershipSchema = z.enum(["PUBLIC", "PRIVATE"]);
const studyCycleSchema = z.enum([
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
]);
const userRoleSchema = z.enum(["ADMIN", "USER"]);

const integerSchema = z.number().int();
const positiveIntegerSchema = integerSchema.positive();
const durationYearsSchema = integerSchema.min(1).max(10);
const ectsSchema = positiveIntegerSchema;
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
  searchTermSchema,
  studyCycleSchema,
  userRoleSchema,
};
