import { createTCount } from "../../../src/utils/pluralize";

const t = (key: string) => key;

function formFor(languageTag: string, count: number) {
  const tCount = createTCount(t, languageTag);
  return tCount("universitiesPage.trackCount", count).replace(
    "universitiesPage.trackCount_",
    "",
  );
}

describe("createTCount", () => {
  test.each([
    [1, "one"],
    [21, "one"],
    [101, "one"],
    [2, "few"],
    [4, "few"],
    [22, "few"],
    [0, "other"],
    [5, "other"],
    [11, "other"],
    [12, "other"],
    [14, "other"],
    [111, "other"],
  ])("BCS (sr-Latn) uses the %s form for %i", (count, form) => {
    expect(formFor("sr-Latn", count)).toBe(form);
  });

  test.each([
    [1, "one"],
    [2, "other"],
    [21, "other"],
  ])("English uses the %s form for %i", (count, form) => {
    expect(formFor("en", count)).toBe(form);
  });

  test.each([
    [1, "one"],
    [101, "one"],
    [2, "two"],
    [102, "two"],
    [3, "few"],
    [4, "few"],
    [5, "other"],
    [21, "other"],
  ])("Slovenian uses the %s form for %i", (count, form) => {
    expect(formFor("sl", count)).toBe(form);
  });

  test.each([
    [1, "one"],
    [21, "one"],
    [11, "other"],
    [2, "other"],
  ])("Macedonian uses the %s form for %i", (count, form) => {
    expect(formFor("mk", count)).toBe(form);
  });

  test.each([
    [1, "one"],
    [2, "other"],
    [21, "other"],
  ])("Albanian uses the %s form for %i", (count, form) => {
    expect(formFor("sq", count)).toBe(form);
  });
});
