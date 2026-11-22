import { describe, test, expect } from "vitest";
import { tokenizeSearchTerm } from "../../../src/search/tokenize.js";
import { COUNTRY_ALIASES } from "../../../src/search/aliases.js";

function tokenCountry(word: string, stem: string): string | undefined {
  for (const form of [word.toUpperCase(), stem.toUpperCase()]) {
    const country = COUNTRY_ALIASES[form];
    if (country) return country;
  }
  return undefined;
}

// search requires every word to match, so a phrase only finds its country
// when every word resolves to that country
function resolvedCountry(phrase: string): string | undefined {
  const countries = new Set(
    tokenizeSearchTerm(phrase)
      .filter((token) => token.kind === "text")
      .map((token) => tokenCountry(token.word, token.stem)),
  );
  const [country] = countries;
  return countries.size === 1 ? country : undefined;
}

describe("country alias phrases resolve through the tokenizer", () => {
  test.each([
    ["Albanija", "ALB"],
    ["Albaniji", "ALB"],
    ["Albania", "ALB"],
    ["albanski", "ALB"],
    ["Shqipëria", "ALB"],
    ["Shqipërisë", "ALB"],
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
    ["Slovenija", "SVN"],
    ["Sloveniji", "SVN"],
    ["Slovenia", "SVN"],
    ["slovenski", "SVN"],
    ["Kosovo", "XKX"],
    ["Kosova", "XKX"],
    ["Kosovës", "XKX"],
    ["kosovski", "XKX"],
    ["Makedonija", "MKD"],
    ["Makedoniji", "MKD"],
    ["Sjeverna Makedonija", "MKD"],
    ["North Macedonia", "MKD"],
    ["Severna Makedonija", "MKD"],
    ["makedonski", "MKD"],
    ["Maqedonisë", "MKD"],
    ["Maqedoni e Veriut", "MKD"],
  ])("%s -> %s", (phrase, expected) => {
    expect(resolvedCountry(phrase)).toBe(expected);
  });
});
