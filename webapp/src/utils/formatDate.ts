import { LANGUAGE_TAGS, setSystemLanguage } from "./setInitialLanguage";

import type { Language } from "../types";

function formatDate(value: string | Date, language: Language): string {
  const resolved = language === "system" ? setSystemLanguage() : language;
  return new Date(value).toLocaleDateString(LANGUAGE_TAGS[resolved]);
}

export { formatDate };
