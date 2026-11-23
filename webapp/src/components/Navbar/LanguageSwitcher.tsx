import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Select } from "../sharedComponents/Select";
import {
  LANGUAGE_NAMES,
  SYSTEM_LANGUAGES,
} from "../../utils/setInitialLanguage";

import type { Language, SetLanguage } from "../../types";

const LANGUAGE_OPTIONS: Language[] = ["system", ...SYSTEM_LANGUAGES];

function LanguageSwitcher({
  setLanguage,
  language,
}: {
  setLanguage: SetLanguage;
  language: Language;
}) {
  const { t } = use(RootContext);
  const label = t("nav.language");

  return (
    <Select
      id="language-switcher"
      aria-label={label}
      // compact for the navbar; the ! makes these win over Select's own text
      // size, padding and wrapping. The extra vertical padding with the
      // smaller phone text keeps it as tall as the menu button.
      className="md:flex-none truncate! text-xs! sm:text-sm! pl-2! pr-7! py-2.5! sm:py-2! bg-position-[right_0.5rem_center]!"
      value={language}
      onChange={(e) => {
        const next = LANGUAGE_OPTIONS.find(
          (option) => option === e.target.value,
        );
        if (next) setLanguage(next);
      }}
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {label}:{" "}
          {option === "system" ? t("language.system") : LANGUAGE_NAMES[option]}
        </option>
      ))}
    </Select>
  );
}

export { LanguageSwitcher };
