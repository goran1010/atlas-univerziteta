// Bosnian/Serbian terms and common synonyms mapped to the English enum
// values, so search matches in both languages. Local words are keyed by
// their STEM so every gender/case form matches (javna/javni/javno -> JAVN);
// words the stemmer leaves alone (prvi, master) are keyed as typed. Tokens
// arrive diacritic-folded, so only ASCII spellings are keyed.
const ENUM_ALIASES: Record<string, string> = {
  JAVN: "PUBLIC",
  PRIVATN: "PRIVATE",
  PRVI: "FIRST",
  BACHELOR: "FIRST",
  DRUG: "SECOND",
  DRUGI: "SECOND",
  MASTER: "SECOND",
  TREC: "THIRD",
  TRECI: "THIRD",
  DOCTORAL: "THIRD",
  PHD: "THIRD",
  INTEGRISAN: "INTEGRATED",
  INTEGRISANI: "INTEGRATED",
  STRUCN: "VOCATIONAL",
  SPECIJALISTICK: "SPECIALIST",
  BOSN: "BIH",
  HERCEGO: "BIH",
  BOSNIA: "BIH",
  SRBI: "SRB",
  SERBIA: "SRB",
  HRVAT: "HRV",
  CROATIA: "HRV",
  CRNOGOR: "MNE",
  MONTENEGRO: "MNE",
} as const;

const COUNTRIES = ["BIH", "SRB", "HRV", "MNE"] as const;
const ENTITIES = ["FBIH", "RS", "BD"] as const;
const OWNERSHIPS = ["PUBLIC", "PRIVATE"] as const;
const CYCLES = [
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
] as const;

export { ENUM_ALIASES, COUNTRIES, ENTITIES, OWNERSHIPS, CYCLES };
