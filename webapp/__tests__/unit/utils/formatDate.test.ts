import { formatDate } from "../../../src/utils/formatDate";

describe("formatDate", () => {
  const date = new Date(2026, 9, 28);

  test("formats with Serbian Latin conventions for the sr bundle", () => {
    expect(formatDate(date, "sr")).toBe(date.toLocaleDateString("sr-Latn"));
  });

  test("formats with English conventions for en", () => {
    expect(formatDate(date, "en")).toBe(date.toLocaleDateString("en"));
  });

  test("passes formatting options through", () => {
    expect(
      formatDate("2021-12-16T00:00:00.000Z", "en", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    ).toBe("December 16, 2021");
  });

  test("falls back to day.month.year when the browser has no data for the language", () => {
    vi.spyOn(Intl.DateTimeFormat, "supportedLocalesOf").mockReturnValue([]);

    expect(
      formatDate("2021-12-06T00:00:00.000Z", "mk", { timeZone: "UTC" }),
    ).toBe("06.12.2021");

    vi.restoreAllMocks();
  });

  test("accepts ISO strings", () => {
    expect(formatDate("2026-10-28T00:00:00.000Z", "en")).toBe(
      new Date("2026-10-28T00:00:00.000Z").toLocaleDateString("en"),
    );
  });
});
