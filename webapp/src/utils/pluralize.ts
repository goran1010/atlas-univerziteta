import type { TFunction, TranslationKey } from "../types";

type PluralForm = "one" | "few" | "other";

type PluralBase<Key> = Key extends `${infer Base}_other` ? Base : never;
type PluralKey = PluralBase<TranslationKey>;

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

function tCount(t: TFunction, key: PluralKey, count: number): string {
  return t(`${key}_${slavicPluralForm(count)}`);
}

export { tCount };
