import { LANGUAGE_TAGS, setSystemLanguage } from "./setInitialLanguage";

import type { Language } from "../types";

function formatDate(
  value: string | Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  const resolved = language === "system" ? setSystemLanguage() : language;
  const tag = LANGUAGE_TAGS[resolved];
  const date = new Date(value);

  // Chrome ships no date data for Albanian or Macedonian and would fall back
  // to US English ("12/16/2021"); day.month.year is how all the region's
  // languages write dates
  if (Intl.DateTimeFormat.supportedLocalesOf(tag).length === 0) {
    const utc = options?.timeZone === "UTC";
    const day = utc ? date.getUTCDate() : date.getDate();
    const month = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    const year = utc ? date.getUTCFullYear() : date.getFullYear();
    return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${String(year)}`;
  }

  return date.toLocaleDateString(tag, options);
}

export { formatDate };
