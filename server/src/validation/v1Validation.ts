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

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  country: z.enum(["BIH", "SRB", "HRV", "MNE"]).optional(),
  entity: z.enum(["FBIH", "RS", "BD"]).optional(),
});

function listQuery(input: unknown) {
  return parseRequest(listQuerySchema, input);
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
  country: z.enum(["BIH", "SRB", "HRV", "MNE"]).optional(),
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

// type and cycle alone don't meaningfully narrow the result set (type picks
// which sections to return, cycle only filters programs), so the guard
// requires a search term or a filter that actually restricts the data
const guardedSearchQuerySchema = searchQuerySchema.refine(
  (query) =>
    query.searchTerm !== undefined ||
    query.country !== undefined ||
    query.entity !== undefined ||
    query.ownership !== undefined,
  { message: "Provide a search term or at least one filter (country, entity, ownership)." },
);

function searchQuery(input: unknown) {
  return parseRequest(guardedSearchQuerySchema, input);
}

export {
  getUniversityById,
  getFacultyById,
  getStudyProgramById,
  getTrackById,
  listQuery,
  searchQuery,
};
