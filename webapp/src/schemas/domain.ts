import { z } from "zod";

const targetTypeSchema = z.enum([
  "UNIVERSITY",
  "FACULTY",
  "STUDY_PROGRAM",
  "TRACK",
]);
const countrySchema = z.enum(["BIH", "SRB", "HRV", "MNE"]);
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
const searchTypeSchema = z.enum(["university", "faculty", "studyProgram"]);
const userRoleSchema = z.enum(["ADMIN", "USER"]);

const integerSchema = z.number().int();
const positiveIntegerSchema = integerSchema.positive();
const durationYearsSchema = integerSchema.min(1).max(10);
const ectsSchema = positiveIntegerSchema;
export type Country = z.infer<typeof countrySchema>;
export type Entity = z.infer<typeof entitySchema>;
export type TargetType = z.infer<typeof targetTypeSchema>;
export type Ownership = z.infer<typeof ownershipSchema>;
export type StudyCycle = z.infer<typeof studyCycleSchema>;
export type TypeOfChange = "CREATE" | "UPDATE" | "DELETE";
export type SearchType = z.infer<typeof searchTypeSchema>;

const COUNTRIES = countrySchema.options;
const ENTITIES = entitySchema.options;

export {
  COUNTRIES,
  ENTITIES,
  countrySchema,
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
