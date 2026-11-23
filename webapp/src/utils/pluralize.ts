import type { TFunction, TranslationKey } from "../types";

type PluralBase<Key> = Key extends `${infer Base}_other` ? Base : never;
type PluralKey = PluralBase<TranslationKey>;
type TCountFunction = (key: PluralKey, count: number) => string;

// Every bundle has a key's _one, _two, _few and _other forms, and each
// language's plural rules pick the ones it uses: Slovenian needs all four
// (2 is "two", 21 is "other"), BCS one/few/other, English, Albanian and
// Macedonian one/other. No site language selects "zero" or "many".
function createTCount(t: TFunction, languageTag: string): TCountFunction {
  const rules = new Intl.PluralRules(languageTag);

  return (key, count) => {
    const form = rules.select(count);
    const usedForm = form === "zero" || form === "many" ? "other" : form;
    return t(`${key}_${usedForm}`);
  };
}

export { createTCount };
export type { PluralKey, TCountFunction };
