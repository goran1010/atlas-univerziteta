import type { TFunction, TranslationKey } from "../types";

// Sets validity silently: the red border appears via the :user-invalid
// styles on Input once the user has interacted with the field, and the
// browser reports the message in a bubble only when the form is submitted -
// never mid-keystroke.
function applyValidity(
  input: HTMLInputElement,
  validationKey: TranslationKey | null,
  t: TFunction,
) {
  if (validationKey) {
    input.setCustomValidity(t(validationKey));
  } else {
    input.setCustomValidity("");
  }
}

export { applyValidity };
