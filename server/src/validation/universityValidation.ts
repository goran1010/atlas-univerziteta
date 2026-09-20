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

const searchQuerySchema = z
  .object({
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
      .transform((val) =>
        val === undefined ? undefined : Array.isArray(val) ? val : [val],
      ),
  })
  .refine(
    (data) => data.searchTerm ?? data.entity ?? data.ownership ?? data.cycle,
    {
      message:
        "Provide a search term or at least one filter (entity, ownership, cycle).",
    },
  );

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
