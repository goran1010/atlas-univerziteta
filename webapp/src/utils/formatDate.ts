import { setSystemLanguage } from "./setInitialLanguage";

import type { SystemLanguage } from "./setInitialLanguage";
import type { Language } from "../types";

// the sr bundle is Latin-script BCS, so dates follow sr-Latn conventions
const DATE_LOCALES: Record<SystemLanguage, string> = {
  en: "en",
  sr: "sr-Latn",
};

function formatDate(value: string | Date, language: Language): string {
  const resolved = language === "system" ? setSystemLanguage() : language;
  return new Date(value).toLocaleDateString(DATE_LOCALES[resolved]);
}

export { formatDate };
