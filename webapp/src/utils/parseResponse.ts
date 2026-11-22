import { z } from "zod";

// A successful response whose body does not fit the schema it is read with.
// Retrying returns the same body, so callers show a message without
// "try again" for it.
class InvalidResponseError extends Error {
  constructor(path: string, cause: z.ZodError) {
    super(
      `Response from ${path} did not match its schema:\n${z.prettifyError(cause)}`,
      { cause },
    );
    this.name = "InvalidResponseError";
  }
}

function parseResponse<Schema extends z.ZodType>(
  path: string,
  responseSchema: Schema,
  payload: unknown,
): z.output<Schema> {
  const result = responseSchema.safeParse(payload);
  if (!result.success) throw new InvalidResponseError(path, result.error);
  return result.data;
}

export { InvalidResponseError, parseResponse };
