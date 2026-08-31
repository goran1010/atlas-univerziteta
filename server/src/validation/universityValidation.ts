import { z } from "zod";
import { parseRequest } from "./parseRequest.js";

const getUniversityByIdParamsSchema = z.strictObject({
  id: z
    .string()
    .trim()
    .transform(Number)
    .pipe(
      z
        .number()
        .int({
          error: "University ID must be an integer.",
        })
        .positive({
          error: "University ID must be positive.",
        }),
    ),
});

function getUniversityById(input: unknown) {
  return parseRequest(getUniversityByIdParamsSchema, input);
}

const searchQuerySchema = z.strictObject({
  searchTerm: z
    .string()
    .trim()
    .min(2, {
      message: "Search term must be at least 2 characters.",
    })
    .max(100, {
      message: "Search term must not exceed 100 characters.",
    }),
});

function searchQuery(input: unknown) {
  return parseRequest(searchQuerySchema, input);
}

export { getUniversityById, searchQuery };
