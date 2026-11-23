// The single fold implementation shared by the write side (fields.ts) and
// the read side (tokenize.ts) - stored columns and query terms MUST fold
// identically or search silently misses rows.
//
// NFD decomposition strips most diacritics (č, ć, š, ž, ü, ö, ñ, etc.).
// Characters that NFD leaves intact get an explicit map. The dj digraph
// folds to d so "Đorđe", "Djordje" and "dorde" all land on the same form.
//
// The stored data is Latin-only, so Serbian and Macedonian Cyrillic input is
// transliterated first, to Latin with diacritics: the folds described above
// then treat it exactly like Latin input (ћ to ć to c). Macedonian ѓ and ќ
// become ǵ and ḱ, matching how the North Macedonian data is romanized.

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  ђ: "đ",
  ѓ: "ǵ",
  е: "e",
  ж: "ž",
  з: "z",
  ѕ: "dz",
  и: "i",
  ј: "j",
  к: "k",
  л: "l",
  љ: "lj",
  м: "m",
  н: "n",
  њ: "nj",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  ћ: "ć",
  ќ: "ḱ",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "č",
  џ: "dž",
  ш: "š",
};

const EXTRA_FOLDS: Record<string, string> = {
  đ: "d",
  ł: "l",
  ø: "o",
};

const MULTI_CHAR_FOLDS: [string, string][] = [
  ["ß", "ss"],
  ["æ", "ae"],
  ["dj", "d"],
];

function foldSearchText(text: string): string {
  let folded = text
    .toLowerCase()
    .replace(/\p{Script=Cyrillic}/gu, (char) => CYRILLIC_TO_LATIN[char] ?? char)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đłø]/g, (char) => EXTRA_FOLDS[char] ?? char);

  for (const [from, to] of MULTI_CHAR_FOLDS) {
    folded = folded.replaceAll(from, to);
  }

  return folded;
}

function foldSearchTextOrNull(text: string | null): string | null {
  return text === null ? null : foldSearchText(text);
}

export { foldSearchText, foldSearchTextOrNull };
