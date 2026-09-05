import type { TFunction } from "../types/i18n";

type PluralForm = "one" | "few" | "other";

function slavicPluralForm(count: number): PluralForm {
  const abs = Math.abs(count);
  const lastDigit = abs % 10;
  const lastTwoDigits = abs % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) return "one";
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  )
    return "few";
  return "other";
}

function tCount(t: TFunction, key: string, count: number): string {
  const form = slavicPluralForm(count);
  const pluralKey = `${key}_${form}`;
  const translated = t(pluralKey);
  if (translated !== pluralKey) return translated;
  return t(key);
}

export { tCount };
