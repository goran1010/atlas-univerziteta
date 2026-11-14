import { setSystemLanguage } from "../../../src/utils/setInitialLanguage";

let originalNavigatorLanguages: readonly string[];

beforeEach(() => {
  originalNavigatorLanguages = navigator.languages;
});

afterEach(() => {
  Object.defineProperty(window.navigator, "languages", {
    value: originalNavigatorLanguages,
    configurable: true,
  });
});

function setNavigatorLanguages(languages: string[]) {
  Object.defineProperty(window.navigator, "languages", {
    value: languages,
    configurable: true,
  });
}

describe("setInitialLanguage", () => {
  test("returns en when the browser prefers English", () => {
    setNavigatorLanguages(["en-US"]);

    expect(setSystemLanguage()).toBe("en");
  });

  test("returns sr when the browser prefers Serbian", () => {
    setNavigatorLanguages(["sr-Latn"]);

    expect(setSystemLanguage()).toBe("sr");
  });

  test.each(["bs", "bs-BA", "hr", "hr-HR", "cnr", "cnr-ME"])(
    "maps browser locale %s to the sr bundle",
    (locale) => {
      setNavigatorLanguages([locale]);

      expect(setSystemLanguage()).toBe("sr");
    },
  );

  test("takes the first preference the app has a bundle for", () => {
    setNavigatorLanguages(["de-DE", "hr-HR", "en"]);
    expect(setSystemLanguage()).toBe("sr");

    setNavigatorLanguages(["de-DE", "en-GB", "sr"]);
    expect(setSystemLanguage()).toBe("en");
  });

  test("falls back to en when no preference has a bundle", () => {
    setNavigatorLanguages(["fr-FR", "de"]);

    expect(setSystemLanguage()).toBe("en");
  });
});
