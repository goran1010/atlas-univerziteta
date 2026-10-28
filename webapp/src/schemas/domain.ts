import { z } from "zod";

const targetTypeSchema = z.enum([
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
const searchTypeSchema = z.enum(["university", "faculty", "studyProgram"]);
const userRoleSchema = z.enum(["ADMIN", "USER"]);

const integerSchema = z.number().int();
const positiveIntegerSchema = integerSchema.positive();
const durationYearsSchema = integerSchema.min(1).max(10);
const ectsSchema = positiveIntegerSchema;
export type Entity = z.infer<typeof entitySchema>;
export type TargetType = z.infer<typeof targetTypeSchema>;
export type Ownership = z.infer<typeof ownershipSchema>;
export type StudyCycle = z.infer<typeof studyCycleSchema>;
export type TypeOfChange = z.infer<typeof typeOfChangeSchema>;
export type SearchType = z.infer<typeof searchTypeSchema>;

export {
  durationYearsSchema,
  ectsSchema,
  entitySchema,
  targetTypeSchema,
  integerSchema,
  ownershipSchema,
  positiveIntegerSchema,
  searchTypeSchema,
  studyCycleSchema,
  userRoleSchema,
};
