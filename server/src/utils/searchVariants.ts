const MAX_VARIANTS = 64;

const ALTERNATIVES: Record<string, string[]> = {
  c: ["c", "č", "ć"],
  s: ["s", "š"],
  z: ["z", "ž"],
  d: ["d", "đ"],
  č: ["č", "c"],
  ć: ["ć", "c"],
  š: ["š", "s"],
  ž: ["ž", "z"],
  đ: ["đ", "dj", "d"],
};

function expandSearchTerm(term: string): string[] {
  const lower = term.toLowerCase();
  let variants: string[] = [""];

  for (let i = 0; i < lower.length; i++) {
    const char = lower[i] ?? "";
    let alternatives: string[];
    if (lower.startsWith("dj", i)) {
      alternatives = ["dj", "đ"];
      i++; // account for the "j"
    } else {
      alternatives = ALTERNATIVES[char] ?? [char];
    }
    const usable =
      variants.length * alternatives.length > MAX_VARIANTS
        ? alternatives.slice(0, 1)
        : alternatives;
    variants = variants.flatMap((variant) =>
      usable.map((alternative) => variant + alternative),
    );
  }

  return [...new Set([lower, ...variants])];
}

type SearchToken =
  | { kind: "text"; word: string; stem: string; variants: string[] }
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

// Numbers pair with a following unit word ("180 ects" -> one ects token,
// "3 godine" -> one duration token); a bare number stays a number token and
// a unit word without a number is dropped. Text words shorter than two
// characters (BS/HR/SR prepositions like "u" or "i") would exclude valid
// matches under AND semantics, so they are dropped too.
function tokenizeSearchTerm(term: string): SearchToken[] {
  const words = term.split(/\s+/).filter((word) => word.length > 0);
  const tokens: SearchToken[] = [];

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index] ?? "";
    const lower = word.toLowerCase();

    // longer digit runs are ids or typos, not ECTS/duration/founding years
    if (/^\d{1,6}$/.test(word)) {
      const value = Number(word);
      const nextWord = (words[index + 1] ?? "").toLowerCase();
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

    if (ECTS_UNITS.has(lower) || DURATION_UNITS.has(lower)) continue;
    if (word.length < 2) continue;

    const stem = stemWord(word);
    tokens.push({ kind: "text", word, stem, variants: expandSearchTerm(stem) });
  }

  return tokens;
}

export { expandSearchTerm, stemWord, tokenizeSearchTerm };
export type { SearchToken };
