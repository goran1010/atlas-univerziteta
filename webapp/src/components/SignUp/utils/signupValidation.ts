import {
  emailSchema,
  getSignupPasswordValidationKey,
} from "../../../schemas/auth";
import { applyValidity } from "../../utils/formValidation";

import type { TFunction } from "../../../types/i18n";

function checkSignupFieldValidity(
  fieldName: string,
  emailInput: HTMLInputElement | null,
  passwordInput: HTMLInputElement | null,
  confirmPasswordInput: HTMLInputElement | null,
  t: TFunction,
) {
  if (
    emailInput === null ||
    passwordInput === null ||
    confirmPasswordInput === null
  )
    return;

  if (fieldName === "email") {
    const key = emailSchema.safeParse(emailInput.value).success
      ? null
      : "validation.email.invalid";
    applyValidity(emailInput, key, t);
  }

  if (fieldName === "password") {
    applyValidity(
      passwordInput,
      getSignupPasswordValidationKey(passwordInput.value),
      t,
    );
  }

  if (fieldName === "confirm-password") {
    const key =
      passwordInput.value.trim() !== confirmPasswordInput.value.trim()
        ? "validation.password.mustMatch"
        : null;
    applyValidity(confirmPasswordInput, key, t);
  }
}

function checkSignupFormValidity(
  emailInput: HTMLInputElement | null,
  passwordInput: HTMLInputElement | null,
  confirmPasswordInput: HTMLInputElement | null,
  t: TFunction,
) {
  checkSignupFieldValidity(
    "email",
    emailInput,
    passwordInput,
    confirmPasswordInput,
    t,
  );
  checkSignupFieldValidity(
    "password",
    emailInput,
    passwordInput,
    confirmPasswordInput,
    t,
  );
  checkSignupFieldValidity(
    "confirm-password",
    emailInput,
    passwordInput,
    confirmPasswordInput,
    t,
  );
}

export { checkSignupFieldValidity, checkSignupFormValidity };
