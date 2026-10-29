import { describe, test, expect } from "vitest";
import { tokenizeSearchTerm } from "../../../src/search/tokenize.js";
import { ENUM_ALIASES } from "../../../src/search/aliases.js";

function resolvedCountry(phrase: string): string | undefined {
  const tokens = tokenizeSearchTerm(phrase);
  for (const token of tokens) {
    if (token.kind !== "text") continue;
    for (const form of [token.word.toUpperCase(), token.stem.toUpperCase()]) {
      const candidate = ENUM_ALIASES[form] ?? form;
      if (["BIH", "SRB", "HRV", "MNE"].includes(candidate)) {
        return candidate;
      }
    }
  }
  return undefined;
}

describe("country alias phrases resolve through the tokenizer", () => {
  test.each([
    ["Bosna", "BIH"],
    ["Bosna i Hercegovina", "BIH"],
    ["Hercegovina", "BIH"],
    ["Bosnia", "BIH"],
    ["Srbija", "SRB"],
    ["Serbia", "SRB"],
    ["Hrvatska", "HRV"],
    ["Croatia", "HRV"],
    ["Crna Gora", "MNE"],
    ["Crne Gore", "MNE"],
    ["crnogorski", "MNE"],
    ["Montenegro", "MNE"],
  ])("%s -> %s", (phrase, expected) => {
    expect(resolvedCountry(phrase)).toBe(expected);
  });
});
