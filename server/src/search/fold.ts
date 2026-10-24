// The single fold implementation shared by the write side (fields.ts) and
// the read side (tokenize.ts) - stored columns and query terms MUST fold
// identically or search silently misses rows. Lowercase, BCS diacritics
// stripped, đ and the dj digraph both fold to d so "Đorđe", "Djordje" and
// "dorde" land on the same form.
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

export { foldSearchText, foldSearchTextOrNull };
