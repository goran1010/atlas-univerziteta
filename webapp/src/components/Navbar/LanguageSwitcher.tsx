import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";
import { Select } from "../sharedComponents/Select";
import { SYSTEM_LANGUAGES } from "../../utils/setInitialLanguage";

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
  const { addNotification } = use(NotificationContext);
  const label = t("nav.language");

  return (
    <Select
      id="language-switcher"
      aria-label={label}
      compact
      className="md:flex-none"
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
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {label}:{" "}
          {option === "system" ? t("language.system") : option.toUpperCase()}
        </option>
      ))}
    </Select>
  );
}

export { LanguageSwitcher };
