import { foldSearchText } from "../../../src/search/fold.js";
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
