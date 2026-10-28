import { getSignupPasswordValidationKey } from "../../../schemas/auth";
import { applyValidity } from "../../../utils/formValidation";

import type { TFunction } from "../../../types";

function checkResetPasswordFieldValidity(
  fieldName: string,
  passwordInput: HTMLInputElement | null,
  confirmPasswordInput: HTMLInputElement | null,
  t: TFunction,
) {
  if (passwordInput === null || confirmPasswordInput === null) return;

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

function checkResetPasswordFormValidity(
  passwordInput: HTMLInputElement | null,
  confirmPasswordInput: HTMLInputElement | null,
  t: TFunction,
) {
  checkResetPasswordFieldValidity(
    "password",
    passwordInput,
    confirmPasswordInput,
    t,
  );
  checkResetPasswordFieldValidity(
    "confirm-password",
    passwordInput,
    confirmPasswordInput,
    t,
  );
}

export { checkResetPasswordFieldValidity, checkResetPasswordFormValidity };
