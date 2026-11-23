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

  test("transliterates Serbian Cyrillic", () => {
    expect(foldSearchText("медицина")).toBe("medicina");
    expect(foldSearchText("МЕДИЦИНА")).toBe("medicina");
    expect(foldSearchText("Србија")).toBe("srbija");
    expect(foldSearchText("Ниш")).toBe("nis");
    expect(foldSearchText("Ћуприја")).toBe("cuprija");
    expect(foldSearchText("Ђорђе")).toBe("dorde");
    expect(foldSearchText("Љубљана")).toBe("ljubljana");
    expect(foldSearchText("Његош")).toBe("njegos");
    expect(foldSearchText("џез")).toBe("dzez");
  });

  test("transliterates Macedonian Cyrillic", () => {
    expect(foldSearchText("Скопје")).toBe("skopje");
    expect(foldSearchText("Ѓорче Петров")).toBe("gorce petrov");
    expect(foldSearchText("Меѓународни")).toBe("megunarodni");
    expect(foldSearchText("Сообраќај")).toBe("soobrakaj");
    expect(foldSearchText("ѕвезда")).toBe("dzvezda");
  });

  test("folds Cyrillic and Latin spellings to the same form", () => {
    expect(foldSearchText("Факултет техничких наука")).toBe(
      foldSearchText("Fakultet tehničkih nauka"),
    );
    expect(foldSearchText("Меѓународни")).toBe(foldSearchText("Meǵunarodni"));
    expect(foldSearchText("Сообраќајно")).toBe(foldSearchText("Soobraḱajno"));
  });

  test("leaves Latin text in mixed-script input untouched", () => {
    expect(foldSearchText("ЕСПБ 180 ECTS")).toBe("espb 180 ects");
  });
});
