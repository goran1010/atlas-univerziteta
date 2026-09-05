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

const searchQuerySchema = z.object({
  searchTerm: z
    .string()
    .trim()
    .min(2, {
      message: "Search term must be at least 2 characters.",
    })
    .max(100, {
      message: "Search term must not exceed 100 characters.",
    }),
  entity: z.enum(["FBIH", "RS", "BD"]).optional(),
  ownership: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  cycle: z
    .enum([
      "FIRST",
      "SECOND",
      "THIRD",
      "INTEGRATED",
      "VOCATIONAL",
      "SPECIALIST",
    ])
    .optional(),
});

function searchQuery(input: unknown) {
  return parseRequest(searchQuerySchema, input);
}

export { getUniversityById, getFacultyById, getStudyProgramById, searchQuery };
