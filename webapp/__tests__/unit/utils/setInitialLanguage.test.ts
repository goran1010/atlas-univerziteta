import { setSystemLanguage } from "../../../src/utils/setInitialLanguage";

let originalNavigatorLanguage: string;

beforeEach(() => {
  originalNavigatorLanguage = navigator.language;
});

afterEach(() => {
  Object.defineProperty(window.navigator, "language", {
    value: originalNavigatorLanguage,
    configurable: true,
  });
});

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, "language", {
    value: language,
    configurable: true,
  });
}

describe("setInitialLanguage", () => {
  test("returns en when browser language starts with en", () => {
    setNavigatorLanguage("en-US");

    const result = setSystemLanguage();

    expect(result).toBe("en");
  });

  test("returns sr when browser language starts with sr", () => {
    setNavigatorLanguage("sr-Latn");

    const result = setSystemLanguage();

    expect(result).toBe("sr");
  });

  test.each(["bs", "bs-BA", "hr", "hr-HR"])(
    "maps BCS browser locale %s to the sr bundle",
    (locale) => {
      setNavigatorLanguage(locale);
      expect(setSystemLanguage()).toBe("sr");
    },
  );

  test("falls back to en for unsupported browser language", () => {
    setNavigatorLanguage("fr-FR");

    const result = setSystemLanguage();

    expect(result).toBe("en");
  });
});
