const SYSTEM_LANGUAGES = ["en", "sr", "sq", "mk"] as const;

export type SystemLanguage = (typeof SYSTEM_LANGUAGES)[number];

// BCP 47 tags for <html lang> and date formatting; a bare "sr" means
// Cyrillic, and the Serbian bundle is written in Latin script
const LANGUAGE_TAGS: Record<SystemLanguage, string> = {
  en: "en",
  sr: "sr-Latn",
  sq: "sq",
  mk: "mk",
};

// a browser language code's bundle; the sr bundle is written for Bosnian,
// Croatian, Montenegrin and Serbian readers alike (sh is the old
// Serbo-Croatian code)
const BUNDLE_BY_CODE: Partial<Record<string, SystemLanguage>> = {
  en: "en",
  sr: "sr",
  bs: "sr",
  hr: "sr",
  cnr: "sr",
  sh: "sr",
  sq: "sq",
  mk: "mk",
};

function setSystemLanguage(): SystemLanguage {
  for (const tag of navigator.languages) {
    const code = tag.split("-")[0]?.toLowerCase() ?? "";
    const bundle = BUNDLE_BY_CODE[code];
    if (bundle) return bundle;
  }
  return "en";
}

export { SYSTEM_LANGUAGES, LANGUAGE_TAGS, setSystemLanguage };
