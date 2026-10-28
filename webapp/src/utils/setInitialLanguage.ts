export type SystemLanguage = "en" | "sr";

// the "sr" bundle holds the shared BCS text, so all three of its
// standard-language codes resolve to it
const BCS_LANGUAGE_CODES = new Set(["sr", "bs", "hr"]);

function setSystemLanguage(): SystemLanguage {
  const browserLanguage = navigator.language.slice(0, 2);

  if (BCS_LANGUAGE_CODES.has(browserLanguage)) {
    return "sr";
  }
  return "en";
}

export { setSystemLanguage };
