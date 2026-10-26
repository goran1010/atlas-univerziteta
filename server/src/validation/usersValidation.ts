import { z } from "zod";

import { parseRequest } from "./parseRequest.js";

// the body is optional entirely - a plain request without one is still valid
const requestAdminSchema = z
  .strictObject({
    reason: z
      .string()
      .trim()
      .min(1)
      .max(1000, { error: "Reason must be 1000 characters or fewer" })
      .optional(),
  })
  .optional();

function requestAdmin(input: unknown) {
  return parseRequest(requestAdminSchema, input);
}

export { requestAdmin };
