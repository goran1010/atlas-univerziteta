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
const typeOfChangeSchema = z.enum(["CREATE", "UPDATE", "DELETE"]);
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

export type Entity = z.infer<typeof entitySchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;
export type Ownership = z.infer<typeof ownershipSchema>;
export type StudyCycle = z.infer<typeof studyCycleSchema>;
export type TypeOfChange = z.infer<typeof typeOfChangeSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

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
  typeOfChangeSchema,
  userRoleSchema,
};
