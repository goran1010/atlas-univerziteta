import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { SwitcherChip } from "./SwitcherChip";
import { MonitorIcon } from "../sharedComponents/icons";
import {
  LANGUAGE_TAGS,
  SYSTEM_LANGUAGES,
} from "../../utils/setInitialLanguage";

import type { Language, SetLanguage } from "../../types";
import type { SystemLanguage } from "../../utils/setInitialLanguage";

const LANGUAGE_OPTIONS: Language[] = ["system", ...SYSTEM_LANGUAGES];

// "sr" is the one interface for Bosnian, Croatian, and Serbian
const LANGUAGE_CODES: Record<SystemLanguage, string> = {
  en: "EN",
  sr: "BHS",
  sq: "SQ",
  mk: "MK",
  sl: "SL",
};

// each language by its own name, the same in every interface
const LANGUAGE_NAMES: Record<SystemLanguage, string> = {
  en: "English",
  sr: "Bosanski / Hrvatski / Srpski",
  sq: "Shqip",
  mk: "Македонски",
  sl: "Slovenščina",
};

function LanguageSwitcher({
  setLanguage,
  language,
}: {
  setLanguage: SetLanguage;
  language: Language;
}) {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);
  const label = t("nav.language");

  return (
    <SwitcherChip
      id="language-switcher"
      aria-label={label}
      value={language}
      onChange={(e) => {
        const next = LANGUAGE_OPTIONS.find(
          (option) => option === e.target.value,
        );
        if (!next) return;
        setLanguage(next);
        addNotification({
          type: "info",
          message: t(`language.switched.${next}`),
        });
      }}
      face={
        <>
          {language === "system" ? (
            <MonitorIcon className="text-base" />
          ) : (
            <span className="rounded-sm border border-current px-0.5 text-[0.625rem] leading-3.5 font-bold">
              {LANGUAGE_CODES[language]}
            </span>
          )}
          {label}
        </>
      }
    >
      {LANGUAGE_OPTIONS.map((option) =>
        option === "system" ? (
          <option key={option} value={option}>
            {t("language.system")}
          </option>
        ) : (
          <option key={option} value={option} lang={LANGUAGE_TAGS[option]}>
            {LANGUAGE_NAMES[option]}
          </option>
        ),
      )}
    </SwitcherChip>
  );
}

export { LanguageSwitcher };
