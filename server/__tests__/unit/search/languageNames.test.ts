/* cspell:disable */
import { describe, test, expect } from "vitest";
import { LANGUAGE_NAMES } from "../../../src/search/languageNames.js";
import { studyProgramOwnMatch } from "../../../src/search/matchers.js";
import { tokenizeSearchTerm } from "../../../src/search/tokenize.js";
import { PROGRAM_LANGUAGES } from "../../../src/validation/languages.js";

function languageCodes(term: string): string[] {
  const [token] = tokenizeSearchTerm(term);
  if (!token) return [];
  const clause = studyProgramOwnMatch(token).find(
    (candidate) => "languages" in candidate,
  ) as { languages: { hasSome: string[] } } | undefined;
  return clause ? [...clause.languages.hasSome].sort() : [];
}

describe("LANGUAGE_NAMES", () => {
  test("names every program language in all five site languages", () => {
    for (const code of PROGRAM_LANGUAGES) {
      const names = LANGUAGE_NAMES[code];
      expect(names.length, code).toBeGreaterThanOrEqual(5);
      expect(
        names.some((name) => /\p{Script=Cyrillic}/u.test(name)),
        `${code} has a Macedonian name`,
      ).toBe(true);
    }
  });
});

describe("language search terms", () => {
  test.each([
    "English",
    "engleski",
    "anglisht",
    "англиски",
    "angleščina",
    "Angliski",
  ])("%s finds English-taught programs", (term) => {
    expect(languageCodes(term)).toEqual(["en"]);
  });

  test("inflected forms match through their stem", () => {
    expect(languageCodes("engleskom")).toEqual(["en"]);
    expect(languageCodes("njemačkom")).toEqual(["de"]);
    expect(languageCodes("angleščini")).toEqual(["en"]);
  });

  // every word of the free-text values the data held before the codes
  test.each([
    ["srpski", "sr"],
    ["hrvatski", "hr"],
    ["bosanski", "bs"],
    ["crnogorski", "cnr"],
    ["shqip", "sq"],
    ["albanski", "sq"],
    ["makedonski", "mk"],
    ["italijanski", "it"],
    ["talijanski", "it"],
    ["italisht", "it"],
    ["njemački", "de"],
    ["gjermanisht", "de"],
    ["francuski", "fr"],
    ["frëngjisht", "fr"],
    ["turski", "tr"],
    ["turqisht", "tr"],
    ["arapski", "ar"],
    ["arabisht", "ar"],
    ["ruski", "ru"],
    ["mađarski", "hu"],
    ["boshnjakisht", "bs"],
    ["greqisht", "el"],
    ["spanjisht", "es"],
  ])("%s -> %s", (term, code) => {
    expect(languageCodes(term)).toEqual([code]);
  });

  test("BSKM covers the four BCS-family languages", () => {
    expect(languageCodes("BSKM")).toEqual(["bs", "cnr", "hr", "sr"]);
  });

  test.each(["Croatia", "Serbia", "Bosnia", "Albania", "Shqipëria", "engl"])(
    "%s is not a language name",
    (term) => {
      expect(languageCodes(term)).toEqual([]);
    },
  );

  test("languages without a code and ordinary words match nothing", () => {
    expect(languageCodes("latinski")).toEqual([]);
    expect(languageCodes("informatika")).toEqual([]);
  });
});
