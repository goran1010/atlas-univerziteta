// Languages a study program is taught in, as ISO 639 codes - the shortest
// code each language has, so Montenegrin, which has no two-letter code, is
// cnr. Regional languages first, then the foreign ones in the data. Plain
// strings in the database, so adding a language needs no migration.
const PROGRAM_LANGUAGES = [
  "bs",
  "hr",
  "sr",
  "cnr",
  "sq",
  "mk",
  "sl",
  "en",
  "de",
  "fr",
  "it",
  "ru",
  "tr",
  "ar",
  "hu",
  "el",
  "es",
] as const;

type ProgramLanguage = (typeof PROGRAM_LANGUAGES)[number];

export { PROGRAM_LANGUAGES };
export type { ProgramLanguage };
