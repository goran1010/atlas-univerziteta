export type SystemLanguage = "en" | "sr";

// the "sr" bundle holds the shared BCS text, so all three of its
// standard-language codes resolve to it
const BCS_LANGUAGE_CODES = new Set(["sr", "bs", "hr", "cnr"]);

function setSystemLanguage(): SystemLanguage {
  const browserLanguage = navigator.language.split("-")[0] ?? "";

  if (BCS_LANGUAGE_CODES.has(browserLanguage)) {
    return "sr";
  }
  return "en";
}

export { setSystemLanguage };
