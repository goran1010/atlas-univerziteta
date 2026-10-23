// Folds searchable text for the search* columns: lowercase, BCS diacritics
// stripped, đ and the dj digraph both folded to d so "Đorđe", "Djordje" and
// "dorde" land on the same form. Writers apply it when storing entities
// (pendingChangeInputs.ts, seed.ts, db/refold.ts) and search applies it to
// query terms, so one plain `contains` matches.
const FOLDS: Record<string, string> = {
  č: "c",
  ć: "c",
  š: "s",
  ž: "z",
  đ: "d",
};

function foldSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čćšžđ]/g, (char) => FOLDS[char] ?? char)
    .replaceAll("dj", "d");
}

// for nullable sources: clearing a field clears its folded copy
function foldSearchTextOrNull(text: string | null): string | null {
  return text === null ? null : foldSearchText(text);
}

type SearchToken =
  | { kind: "text"; word: string; stem: string }
  | { kind: "ects"; value: number }
  | { kind: "duration"; value: number }
  | { kind: "number"; value: number };

// BCS case/gender endings, longest first - the first suffix that leaves a
// stem of at least MIN_STEM_LENGTH is stripped. Substring search then makes
// the stem match every inflected form in the data ("medicin" is contained in
// medicina/medicine/medicini/Medicinski), so only the query needs stemming.
const INFLECTION_SUFFIXES = [
  "ijima",
  "ijama",
  "ima",
  "ama",
  "oga",
  "ega",
  "ome",
  "emu",
  "iju",
  "ije",
  "ija",
  "om",
  "em",
  "og",
  "eg",
  "oj",
  "ih",
  "im",
  "a",
  "e",
  "i",
  "o",
  "u",
];
const MIN_STEM_LENGTH = 4;

function stemWord(word: string): string {
  const lower = word.toLowerCase();
  for (const suffix of INFLECTION_SUFFIXES) {
    if (
      lower.length - suffix.length >= MIN_STEM_LENGTH &&
      lower.endsWith(suffix)
    ) {
      return lower.slice(0, -suffix.length);
    }
  }
  return lower;
}

const ECTS_UNITS = new Set(["ects", "espb"]);
const DURATION_UNITS = new Set([
  "godina",
  "godine",
  "godinu",
  "god",
  "year",
  "years",
]);

// AND semantics mean extra words only narrow results, so eight words cover
// any real query; the cap bounds the number of SQL clauses a request can
// generate.
const MAX_TOKENS = 8;

// Numbers pair with a following unit word ("180 ects" -> one ects token,
// "3 godine" -> one duration token); a bare number stays a number token and
// a unit word without a number is dropped. Text words shorter than two
// characters (BS/HR/SR prepositions like "u" or "i") would exclude valid
// matches under AND semantics, so they are dropped too.
function tokenizeSearchTerm(term: string): SearchToken[] {
  const words = foldSearchText(term)
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const tokens: SearchToken[] = [];

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index] ?? "";

    // longer digit runs are ids or typos, not ECTS/duration/founding years
    if (/^\d{1,6}$/.test(word)) {
      const value = Number(word);
      const nextWord = words[index + 1] ?? "";
      if (ECTS_UNITS.has(nextWord)) {
        tokens.push({ kind: "ects", value });
        index += 1;
      } else if (DURATION_UNITS.has(nextWord)) {
        tokens.push({ kind: "duration", value });
        index += 1;
      } else {
        tokens.push({ kind: "number", value });
      }
      continue;
    }

    if (ECTS_UNITS.has(word) || DURATION_UNITS.has(word)) continue;
    if (word.length < 2) continue;

    tokens.push({ kind: "text", word, stem: stemWord(word) });
  }

  return tokens.slice(0, MAX_TOKENS);
}

export { foldSearchText, foldSearchTextOrNull, stemWord, tokenizeSearchTerm };
export type { SearchToken };
