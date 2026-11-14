import { tCount } from "../../../src/utils/pluralize";

const t = (key: string) => key;

describe("tCount", () => {
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
  ])("count %i uses the %s form", (count, form) => {
    expect(tCount(t, "universitiesPage.trackCount", count)).toBe(
      `universitiesPage.trackCount_${form}`,
    );
  });
});
