import { z } from "zod";
import { parseRequest } from "./parseRequest.js";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Invalid email address" }));

const signupSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_-]+$/, {
        error:
          "Password can only contain letters, numbers, dashes or underscores",
      })
      .min(6, {
        error:
          "Password must be at least 6 characters long and contain at least one number",
      })
      .regex(/\d/, {
        error:
          "Password must be at least 6 characters long and contain at least one number",
      }),
    "confirm-password": z.string().trim(),
  })
  .refine((data) => data.password === data["confirm-password"], {
    path: ["confirm-password"],
    error: "Passwords do not match",
  });

const confirmTokenSchema = z.object({
  token: z.string().trim().min(1, { error: "Token is required" }),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, { error: "Password is required" }),
});

function signup(input: unknown) {
  return parseRequest(signupSchema, input);
}

function confirmToken(input: unknown) {
  return parseRequest(confirmTokenSchema, input);
}

function login(input: unknown) {
  return parseRequest(loginSchema, input);
}

export { signup, confirmToken, login };
