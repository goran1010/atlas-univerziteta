import { emailSchema, loginPasswordSchema } from "../../../schemas/auth";
import { applyValidity } from "../../utils/formValidation";

import type { TFunction } from "../../../types/i18n";

function checkLoginFieldValidity(
  fieldName: string,
  emailInput: HTMLInputElement | null,
  passwordInput: HTMLInputElement | null,
  t: TFunction,
) {
  if (emailInput === null || passwordInput === null) return;

  if (fieldName === "email") {
    const key = emailSchema.safeParse(emailInput.value).success
      ? null
      : "validation.email.invalid";
    applyValidity(emailInput, key, t);
  }

  if (fieldName === "password") {
    const key = loginPasswordSchema.safeParse(passwordInput.value).success
      ? null
      : "validation.password.required";
    applyValidity(passwordInput, key, t);
  }
}

function checkLoginFormValidity(
  emailInput: HTMLInputElement | null,
  passwordInput: HTMLInputElement | null,
  t: TFunction,
) {
  checkLoginFieldValidity("email", emailInput, passwordInput, t);
  checkLoginFieldValidity("password", emailInput, passwordInput, t);
}

export { checkLoginFieldValidity, checkLoginFormValidity };
