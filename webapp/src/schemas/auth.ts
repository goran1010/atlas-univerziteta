import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

// usually a stray space from copy-paste, which would then be needed at every
// login
const signupPasswordNoSurroundingSpacesSchema = z
  .string()
  .refine((value) => value === value.trim());

// BetterAuth rejects passwords under 8 characters server-side
const signupPasswordMinLengthSchema = z.string().min(8);

const signupPasswordRequiresNumberSchema = z.string().regex(/\d/);

const loginPasswordSchema = z.string().trim().min(1);

function getSignupPasswordValidationKey(password: string) {
  if (!signupPasswordNoSurroundingSpacesSchema.safeParse(password).success) {
    return "validation.password.noLeadingOrTrailingSpaces";
  }

  if (!signupPasswordMinLengthSchema.safeParse(password).success) {
    return "validation.password.minLength";
  }

  if (!signupPasswordRequiresNumberSchema.safeParse(password).success) {
    return "validation.password.requiresNumber";
  }

  return null;
}

export { emailSchema, loginPasswordSchema, getSignupPasswordValidationKey };
