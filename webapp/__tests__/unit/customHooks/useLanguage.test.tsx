import { act, renderHook } from "@testing-library/react";
import { useLanguage } from "../../../src/customHooks/useLanguage";

beforeEach(() => {
  localStorage.clear();
});

describe("useLanguage", () => {
  test.each([
    ["sr", "sr-Latn"],
    ["en", "en"],
    ["sq", "sq"],
    ["mk", "mk"],
    ["sl", "sl"],
  ])("sets <html lang> for the %s bundle to %s", (language, tag) => {
    localStorage.setItem("language", language);

    renderHook(() => useLanguage());

    expect(document.documentElement.lang).toBe(tag);
  });

  test("translates with the chosen bundle and keeps the choice", () => {
    const { result } = renderHook(() => useLanguage());

    act(() => {
      result.current.setLanguage("sq");
    });

    expect(result.current.t("nav.language")).toBe("Gjuha");
    expect(result.current.tCount("universitiesPage.durationYears", 3)).toBe(
      "vjet",
    );
    expect(localStorage.getItem("language")).toBe("sq");
  });

  test("counts in Slovenian with the dual", () => {
    localStorage.setItem("language", "sl");

    const { result } = renderHook(() => useLanguage());
    const years = (count: number) =>
      `${String(count)} ${result.current.tCount("universitiesPage.durationYears", count)}`;

    expect([1, 2, 3, 5, 21, 102].map(years)).toEqual([
      "1 leto",
      "2 leti",
      "3 leta",
      "5 let",
      "21 let",
      "102 leti",
    ]);
  });

  test("falls back to system for an unknown saved language", () => {
    localStorage.setItem("language", "xx");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("system");
  });
});
