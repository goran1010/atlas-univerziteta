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

  test("falls back to system for an unknown saved language", () => {
    localStorage.setItem("language", "xx");

    const { result } = renderHook(() => useLanguage());

    expect(result.current.language).toBe("system");
  });
});
