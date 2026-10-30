// The single fold implementation shared by the write side (fields.ts) and
// the read side (tokenize.ts) - stored columns and query terms MUST fold
// identically or search silently misses rows.
//
// NFD decomposition strips most diacritics (č, ć, š, ž, ü, ö, ñ, etc.).
// Characters that NFD leaves intact get an explicit map. The dj digraph
// folds to d so "Đorđe", "Djordje" and "dorde" all land on the same form.

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
