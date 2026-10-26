import { z } from "zod";

const adminRequestSchema = z.object({
  id: z.string(),
  email: z.email(),
  adminRequestedAt: z.string(),
  adminRequestReason: z.string().nullable().optional(),
});

const adminRequestsResponseSchema = z.object({
  message: z.string().nullable(),
  data: z.array(adminRequestSchema),
});

const requestAdminResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    adminRequestedAt: z.string(),
  }),
});

type AdminRequest = z.infer<typeof adminRequestSchema>;

export {
  adminRequestSchema,
  adminRequestsResponseSchema,
  requestAdminResponseSchema,
};
export type { AdminRequest };
