import type { TFunction } from "../types";

function applyValidity(
  input: HTMLInputElement,
  validationKey: string | null,
  t: TFunction,
) {
  if (validationKey) {
    input.setCustomValidity(t(validationKey));
    input.reportValidity();
  } else {
    input.setCustomValidity("");
  }
}

export { applyValidity };
