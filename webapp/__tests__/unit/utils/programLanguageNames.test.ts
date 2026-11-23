import {
  programLanguageName,
  programLanguageNames,
} from "../../../src/utils/programLanguageNames";

const t = (key: string) => key;

describe("programLanguageNames", () => {
  test("translates each known code", () => {
    expect(programLanguageName(t, "cnr")).toBe("programLanguages.cnr");
    expect(programLanguageNames(t, ["bs", "hr", "sr"])).toBe(
      "programLanguages.bs, programLanguages.hr, programLanguages.sr",
    );
  });

  test("shows a code it has no name for as is", () => {
    expect(programLanguageNames(t, ["sq", "xx"])).toBe(
      "programLanguages.sq, xx",
    );
  });

  test("returns an empty string for no languages", () => {
    expect(programLanguageNames(t, [])).toBe("");
  });
});
