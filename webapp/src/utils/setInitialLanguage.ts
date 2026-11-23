const SYSTEM_LANGUAGES = ["en", "sr"] as const;

export type SystemLanguage = (typeof SYSTEM_LANGUAGES)[number];

// BCP 47 tags for <html lang> and date formatting; a bare "sr" means
// Cyrillic, and the Serbian bundle is written in Latin script
const LANGUAGE_TAGS: Record<SystemLanguage, string> = {
  en: "en",
  sr: "sr-Latn",
};

// each site language named in itself, so readers find theirs whichever
// language the site is showing
const LANGUAGE_NAMES: Record<SystemLanguage, string> = {
  en: "English",
  sr: "Bosanski / Hrvatski / Srpski",
};

// Bosnian, Croatian and Montenegrin readers get the Serbian bundle, the
// closer of the two
const SERBIAN_BUNDLE_CODES = new Set(["sr", "bs", "hr", "cnr"]);

function setSystemLanguage(): SystemLanguage {
  for (const tag of navigator.languages) {
    const code = tag.split("-")[0]?.toLowerCase() ?? "";
    if (SERBIAN_BUNDLE_CODES.has(code)) return "sr";
    if (code === "en") return "en";
  }
  return "en";
}

export { SYSTEM_LANGUAGES, LANGUAGE_TAGS, LANGUAGE_NAMES, setSystemLanguage };
