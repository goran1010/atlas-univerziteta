import { z } from "zod";

const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
  }),
});

type ApiError = z.output<typeof apiErrorResponseSchema>["error"];

const actionSuccessResponseSchema = z.object({
  message: z.string(),
  data: z.unknown().optional(),
});

function readApiError(payload: unknown): ApiError | null {
  const result = apiErrorResponseSchema.safeParse(payload);
  return result.success ? result.data.error : null;
}

async function readResponseError(response: Response): Promise<ApiError | null> {
  try {
    return readApiError(await response.json());
  } catch {
    return null;
  }
}

export {
  actionSuccessResponseSchema,
  apiErrorResponseSchema,
  readApiError,
  readResponseError,
};
