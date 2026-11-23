import { programLanguageSchema } from "../schemas/domain";

import type { TFunction } from "../types";

// A code this webapp has no name for (one added to a newer API) shows as is
function programLanguageName(t: TFunction, code: string): string {
  const language = programLanguageSchema.safeParse(code);
  return language.success ? t(`programLanguages.${language.data}`) : code;
}

function programLanguageNames(t: TFunction, codes: readonly string[]): string {
  return codes.map((code) => programLanguageName(t, code)).join(", ");
}

export { programLanguageName, programLanguageNames };
