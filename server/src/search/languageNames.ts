import type { ProgramLanguage } from "../validation/languages.js";

// Each program language's name in English, Bosnian/Croatian/Serbian,
// Albanian, Macedonian and Slovenian, in that order, so a search for
// "english", "engleski", "anglisht", "англиски" or "angleščina" finds the
// same programs. BCS variants that differ (njemački/nemački) are both listed,
// and BSKM is the Albanian shorthand for the four BCS-family languages.
// Written as spelled; matchers.ts folds and stems them for lookup.
// cspell:disable
const LANGUAGE_NAMES: Record<ProgramLanguage, readonly string[]> = {
  bs: ["Bosnian", "bosanski", "boshnjakisht", "босански", "bosanščina", "BSKM"],
  hr: ["Croatian", "hrvatski", "kroatisht", "хрватски", "hrvaščina", "BSKM"],
  sr: ["Serbian", "srpski", "serbisht", "српски", "srbščina", "BSKM"],
  cnr: [
    "Montenegrin",
    "crnogorski",
    "malazezisht",
    "црногорски",
    "črnogorščina",
    "BSKM",
  ],
  sq: ["Albanian", "albanski", "shqip", "албански", "albanščina"],
  mk: ["Macedonian", "makedonski", "maqedonisht", "македонски", "makedonščina"],
  sl: [
    "Slovenian",
    "slovenski",
    "slovenački",
    "sllovenisht",
    "словенечки",
    "slovenščina",
  ],
  en: ["English", "engleski", "anglisht", "англиски", "angleščina"],
  de: ["German", "njemački", "nemački", "gjermanisht", "германски", "nemščina"],
  fr: ["French", "francuski", "frëngjisht", "француски", "francoščina"],
  it: [
    "Italian",
    "italijanski",
    "talijanski",
    "italisht",
    "италијански",
    "italijanščina",
  ],
  ru: ["Russian", "ruski", "rusisht", "руски", "ruščina"],
  tr: ["Turkish", "turski", "turqisht", "турски", "turščina"],
  ar: ["Arabic", "arapski", "arabisht", "арапски", "arabščina"],
  hu: ["Hungarian", "mađarski", "hungarisht", "унгарски", "madžarščina"],
  el: ["Greek", "grčki", "greqisht", "грчки", "grščina"],
  es: ["Spanish", "španski", "španjolski", "spanjisht", "шпански", "španščina"],
};
// cspell:enable

export { LANGUAGE_NAMES };
