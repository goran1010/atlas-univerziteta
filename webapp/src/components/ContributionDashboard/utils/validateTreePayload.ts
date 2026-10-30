import type { z } from "zod";

interface ValidationIssue {
  path: string;
  message: string;
}

function mapZodIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}

export { mapZodIssues };
export type { ValidationIssue };
