import { z } from "zod";
import { parseRequest } from "./parseRequest.js";

const positiveIdParam = z
  .string()
  .trim()
  .transform(Number)
  .pipe(z.number().int().positive());

const idParamsSchema = z.strictObject({ id: positiveIdParam });

function getUniversityById(input: unknown) {
  return parseRequest(idParamsSchema, input);
}

function getFacultyById(input: unknown) {
  return parseRequest(idParamsSchema, input);
}

function getStudyProgramById(input: unknown) {
  return parseRequest(idParamsSchema, input);
}

function getTrackById(input: unknown) {
  return parseRequest(idParamsSchema, input);
}

const studyCycleEnum = z.enum([
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
]);

const searchTypeEnum = z.enum(["university", "faculty", "studyProgram"]);

// repeatable query params arrive as a single value or an array depending on
// how many times they appear in the URL - normalize to an array
function toArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

const searchQuerySchema = z.object({
  searchTerm: z
    .string()
    .trim()
    .min(2, {
      message: "Search term must be at least 2 characters.",
    })
    .max(100, {
      message: "Search term must not exceed 100 characters.",
    })
    .optional(),
  entity: z.enum(["FBIH", "RS", "BD"]).optional(),
  ownership: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  cycle: z
    .union([studyCycleEnum, z.array(studyCycleEnum).min(1)])
    .optional()
    .transform(toArray),
  type: z
    .union([searchTypeEnum, z.array(searchTypeEnum).min(1)])
    .optional()
    .transform(toArray),
});

function searchQuery(input: unknown) {
  return parseRequest(searchQuerySchema, input);
}

export {
  getUniversityById,
  getFacultyById,
  getStudyProgramById,
  getTrackById,
  searchQuery,
};
