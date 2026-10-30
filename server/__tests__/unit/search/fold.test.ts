/* cspell:disable */
import { describe, test, expect } from "vitest";
import { foldSearchText } from "../../../src/search/fold.js";

describe("foldSearchText", () => {
  test("lowercases", () => {
    expect(foldSearchText("Sarajevo")).toBe("sarajevo");
  });

  test("strips BCS diacritics via NFD", () => {
    expect(foldSearchText("čćšžČĆŠŽ")).toBe("ccszccsz");
  });

  test("folds đ and the dj digraph to d", () => {
    expect(foldSearchText("Đorđe")).toBe("dorde");
    expect(foldSearchText("Djordje")).toBe("dorde");
  });

  test("strips common European diacritics", () => {
    expect(foldSearchText("München")).toBe("munchen");
    expect(foldSearchText("Zürich")).toBe("zurich");
    expect(foldSearchText("Malmö")).toBe("malmo");
    expect(foldSearchText("España")).toBe("espana");
    expect(foldSearchText("café")).toBe("cafe");
  });

  test("folds ł, ø, ß, æ", () => {
    expect(foldSearchText("Łódź")).toBe("lodz");
    expect(foldSearchText("Ørsted")).toBe("orsted");
    expect(foldSearchText("Straße")).toBe("strasse");
    expect(foldSearchText("Ærø")).toBe("aero");
  });
});
