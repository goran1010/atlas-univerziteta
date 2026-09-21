import {
  expandSearchTerm,
  tokenizeSearchTerm,
} from "../../../src/utils/searchVariants.js";
import { describe, test, expect } from "vitest";

describe("expandSearchTerm", () => {
  test("returns just the term when no mapped characters are present", () => {
    expect(expandSearchTerm("berlin")).toEqual(["berlin"]);
  });

  test("expands plain characters into accented variants", () => {
    const variants = expandSearchTerm("cazin");

    expect(variants).toContain("cazin");
    expect(variants).toContain("čazin");
    expect(variants).toContain("ćazin");
    expect(variants).toContain("cažin");
  });

  test("expands typed ASCII to accented spellings", () => {
    expect(expandSearchTerm("dzemal")).toContain("džemal");
  });

  test("strips accents from typed accented spellings", () => {
    expect(expandSearchTerm("džemal")).toContain("dzemal");
  });

  test("maps the dj digraph to đ", () => {
    expect(expandSearchTerm("djordje")).toContain("đorđe");
  });

  test("maps đ back to dj and d", () => {
    const variants = expandSearchTerm("đorđe");

    expect(variants).toContain("djordje");
    expect(variants).toContain("dorde");
  });

  test("lowercases the term before expanding", () => {
    const variants = expandSearchTerm("Čapljina");

    expect(variants).toContain("čapljina");
    expect(variants).toContain("capljina");
  });

  test("caps the number of variants and keeps the raw term", () => {
    const term = "c".repeat(100);
    const variants = expandSearchTerm(term);

    expect(variants.length).toBeLessThanOrEqual(65);
    expect(variants).toContain(term);
  });
});

describe("tokenizeSearchTerm", () => {
  test("splits on whitespace and expands each text word", () => {
    const tokens = tokenizeSearchTerm("Banja  Luka");

    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toMatchObject({ kind: "text", word: "Banja" });
    expect(tokens[1]).toMatchObject({ kind: "text", word: "Luka" });
    const first = tokens[0];
    if (first?.kind !== "text") throw new Error("expected a text token");
    expect(first.variants).toContain("banja");
  });

  test("drops text words shorter than two characters", () => {
    const tokens = tokenizeSearchTerm("fizika u sarajevu");

    expect(
      tokens.map((token) => (token.kind === "text" ? token.word : token.kind)),
    ).toEqual(["fizika", "sarajevu"]);
  });

  test("returns an empty list when every word is dropped", () => {
    expect(tokenizeSearchTerm("a b")).toEqual([]);
  });

  test("pairs a number with a following ECTS unit", () => {
    expect(tokenizeSearchTerm("180 ects")).toEqual([
      { kind: "ects", value: 180 },
    ]);
    expect(tokenizeSearchTerm("240 ESPB")).toEqual([
      { kind: "ects", value: 240 },
    ]);
  });

  test("pairs a number with a following duration unit", () => {
    expect(tokenizeSearchTerm("3 godine")).toEqual([
      { kind: "duration", value: 3 },
    ]);
    expect(tokenizeSearchTerm("4 years")).toEqual([
      { kind: "duration", value: 4 },
    ]);
  });

  test("keeps a bare number as a number token", () => {
    expect(tokenizeSearchTerm("1975")).toEqual([
      { kind: "number", value: 1975 },
    ]);
  });

  test("drops a unit word without a preceding number", () => {
    const tokens = tokenizeSearchTerm("informatika ects");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ kind: "text", word: "informatika" });
  });

  test("treats very long digit runs as text", () => {
    const tokens = tokenizeSearchTerm("12345678");

    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ kind: "text", word: "12345678" });
  });

  test("mixes text and numeric tokens", () => {
    expect(tokenizeSearchTerm("informatika 180 ects sarajevo")).toMatchObject([
      { kind: "text", word: "informatika" },
      { kind: "ects", value: 180 },
      { kind: "text", word: "sarajevo" },
    ]);
  });
});
