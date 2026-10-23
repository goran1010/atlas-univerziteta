import {
  foldSearchText,
  stemWord,
  tokenizeSearchTerm,
} from "../../../src/utils/searchText.js";
import { describe, test, expect } from "vitest";

describe("foldSearchText", () => {
  test("leaves plain lowercase text alone", () => {
    expect(foldSearchText("berlin")).toBe("berlin");
  });

  test("lowercases and strips BCS diacritics", () => {
    expect(foldSearchText("Čačak")).toBe("cacak");
    expect(foldSearchText("Šumarstvo")).toBe("sumarstvo");
    expect(foldSearchText("Džemal")).toBe("dzemal");
    expect(foldSearchText("ČĆŠŽ")).toBe("ccsz");
  });

  test("folds đ and the dj digraph to the same form", () => {
    expect(foldSearchText("Đorđe")).toBe("dorde");
    expect(foldSearchText("Djordje")).toBe("dorde");
    expect(foldSearchText("dorde")).toBe("dorde");
    expect(foldSearchText("Međugorje")).toBe("medugorje");
    expect(foldSearchText("Medjugorje")).toBe("medugorje");
  });
});

describe("stemWord", () => {
  test("strips case and gender endings", () => {
    expect(stemWord("medicina")).toBe("medicin");
    expect(stemWord("medicine")).toBe("medicin");
    expect(stemWord("medicini")).toBe("medicin");
    expect(stemWord("medicinom")).toBe("medicin");
    expect(stemWord("javnog")).toBe("javn");
    expect(stemWord("javnim")).toBe("javn");
    expect(stemWord("sarajevu")).toBe("sarajev");
  });

  test("falls back to a shorter suffix when the stem would get too short", () => {
    // "ija" would leave "srb"; the plain "a" keeps a usable stem
    expect(stemWord("srbija")).toBe("srbij");
  });

  test("leaves short words and unknown endings alone", () => {
    expect(stemWord("Luka")).toBe("luka");
    expect(stemWord("prvi")).toBe("prvi");
    expect(stemWord("master")).toBe("master");
  });
});

describe("tokenizeSearchTerm", () => {
  test("splits on whitespace and folds and stems each text word", () => {
    const tokens = tokenizeSearchTerm("Banja  Luka");

    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({ kind: "text", word: "banja", stem: "banj" });
    // "luk" would fall below the minimum stem length, so Luka stays whole
    expect(tokens[1]).toEqual({ kind: "text", word: "luka", stem: "luka" });
  });

  test("folds diacritics before stemming", () => {
    expect(tokenizeSearchTerm("Bihaću")).toEqual([
      { kind: "text", word: "bihacu", stem: "bihac" },
    ]);
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

  test("caps the number of tokens per query", () => {
    const term = Array.from({ length: 20 }, (_, i) => `word${String(i)}`).join(
      " ",
    );

    expect(tokenizeSearchTerm(term)).toHaveLength(8);
  });
});
