import { z } from "zod";

import { userRoleSchema } from "./domain";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const signupPasswordAllowedCharactersSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_-]+$/);

const signupPasswordMinLengthSchema = z.string().trim().min(6);

const signupPasswordRequiresNumberSchema = z.string().trim().regex(/\d/);

const loginPasswordSchema = z.string().trim().min(1);

function getSignupPasswordValidationKey(password: string) {
  if (!signupPasswordAllowedCharactersSchema.safeParse(password).success) {
    return "validation.password.allowedCharacters";
  }

  if (!signupPasswordMinLengthSchema.safeParse(password).success) {
    return "validation.password.minLength";
  }

  if (!signupPasswordRequiresNumberSchema.safeParse(password).success) {
    return "validation.password.requiresNumber";
  }

  return null;
}

const signupResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    email: z.email(),
  }),
});

const loginResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    email: z.email(),
    role: userRoleSchema,
    adminRequestedAt: z.string().nullable().optional(),
  }),
});

const currentUserResponseSchema = z.object({
  message: z.string().nullable(),
  data: z
    .object({
      email: z.email(),
      role: userRoleSchema,
      adminRequestedAt: z.string().nullable().optional(),
    })
    .nullable(),
});

const csrfTokenResponseSchema = z.object({
  message: z.string(),
  data: z.string().min(1),
});

export {
  emailSchema,
  loginPasswordSchema,
  getSignupPasswordValidationKey,
  signupResponseSchema,
  loginResponseSchema,
  currentUserResponseSchema,
  csrfTokenResponseSchema,
};
