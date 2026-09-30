import { z } from "zod";

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

export {
  emailSchema,
  loginPasswordSchema,
  getSignupPasswordValidationKey,
};
