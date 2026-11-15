import { use } from "react";
import { GlobeIcon } from "../sharedComponents/icons";
import { RootContext } from "../../contextData/RootContext";
import { NotificationContext } from "../../contextData/NotificationContext";

import type { Language, SetLanguage, TranslationKey } from "../../types";

const languageOrder: Language[] = ["system", "en", "sr"];

function LanguageIcon({ language }: { language: Language }) {
  if (language === "system") return <GlobeIcon className="text-lg" />;

  return (
    <span
      aria-hidden="true"
      className="rounded-sm border border-(--border-color) px-1 text-xs font-bold leading-tight tracking-wide"
    >
      {language.toUpperCase()}
    </span>
  );
}

function getLabelKey(language: Language): TranslationKey {
  switch (language) {
    case "system":
      return "language.system";
    case "en":
      return "language.english";
    case "sr":
      return "language.serbian";
  }
}

function getNotificationKey(language: Language): TranslationKey {
  switch (language) {
    case "system":
      return "language.switched.system";
    case "en":
      return "language.switched.english";
    case "sr":
      return "language.switched.serbian";
  }
}

function LanguageSwitcher({
  setLanguage,
  language,
}: {
  setLanguage: SetLanguage;
  language: Language;
}) {
  const { t } = use(RootContext);
  const { addNotification } = use(NotificationContext);

  function handleLanguageToggle() {
    const currentIndex = languageOrder.indexOf(language);
    const nextLanguage =
      languageOrder[(currentIndex + 1) % languageOrder.length] ?? language;

    setLanguage(nextLanguage);
    addNotification({
      type: "info",
      message: t(getNotificationKey(nextLanguage)),
    });
  }

  const fullLabel = t(getLabelKey(language));

  return (
    <button
      type="button"
      id="language-switcher"
      aria-label={`${t("language.switchAria")} - ${fullLabel}`}
      onClick={handleLanguageToggle}
      className="min-w-20 w-full md:w-fit relative inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-semibold transition transform hover:cursor-pointer
        bg-(--surface-1) text-(--text-primary) border border-(--border-color) shadow-(--card-shadow-soft)
        hover:bg-(--hover-surface) hover:shadow-(--card-shadow) active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
    >
      <LanguageIcon language={language} />
      <span className="hidden min-[360px]:inline">{t("nav.language")}</span>
    </button>
  );
}

export { LanguageSwitcher };
