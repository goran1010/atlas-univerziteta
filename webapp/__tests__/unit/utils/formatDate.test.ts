import { formatDate } from "../../../src/utils/formatDate";

describe("formatDate", () => {
  const date = new Date(2026, 9, 28);

  test("formats with BCS conventions for the sr bundle", () => {
    expect(formatDate(date, "sr")).toBe(date.toLocaleDateString("sr-Latn"));
  });

  test("formats with English conventions for en", () => {
    expect(formatDate(date, "en")).toBe(date.toLocaleDateString("en"));
  });

  test("accepts ISO strings", () => {
    expect(formatDate("2026-10-28T00:00:00.000Z", "en")).toBe(
      new Date("2026-10-28T00:00:00.000Z").toLocaleDateString("en"),
    );
  });
});
