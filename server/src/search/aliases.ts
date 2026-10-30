// Local terms and common synonyms mapped to enum values so search matches
// in both English and the local languages. Words are keyed by their stem
// or full form, whichever the tokenizer produces (javna/javni/javno ->
// JAVN; prvi, master -> as-is). Tokens arrive diacritic-folded, so only
// ASCII spellings are keyed.
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
  BOSNIA: "BIH",
  HERCEGOVINA: "BIH",
  HERCEGOVIN: "BIH",
  SRBI: "SRB",
  SRBIJ: "SRB",
  SRBIJA: "SRB",
  SERBIA: "SRB",
  HRVAT: "HRV",
  HRVATSK: "HRV",
  HRVATSKA: "HRV",
  CROATIA: "HRV",
  CRNA: "MNE",
  CRNE: "MNE",
  GORA: "MNE",
  GORE: "MNE",
  CRNOGORSK: "MNE",
  CRNOGORSKI: "MNE",
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
