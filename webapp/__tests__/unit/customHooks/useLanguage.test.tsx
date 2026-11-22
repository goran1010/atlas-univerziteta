import { renderHook } from "@testing-library/react";
import { useLanguage } from "../../../src/customHooks/useLanguage";

beforeEach(() => {
  localStorage.clear();
});

describe("useLanguage", () => {
  test.each([
    ["sr", "sr-Latn"],
    ["en", "en"],
  ])("sets <html lang> for the %s bundle to %s", (language, tag) => {
    localStorage.setItem("language", language);

    renderHook(() => useLanguage());

    expect(document.documentElement.lang).toBe(tag);
  });
});
