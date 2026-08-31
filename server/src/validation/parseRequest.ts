import { RequestValidationError } from "../errors/RequestValidationError.js";

import type { z } from "zod";

// Validates request input, throwing a RequestValidationError (400) on failure.
function parseRequest<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(result.error);
  }

  return result.data;
}

export { parseRequest };
