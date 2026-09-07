import { use } from "react";
import { GlobeIcon } from "../sharedComponents/icons";
import { RootContext } from "../../contextData/RootContext";

import type { Language, SetLanguage } from "../../types/i18n";

const languageOrder: Language[] = ["system", "en", "sr"];

function Flag({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width="20"
      height="15"
      className="inline-block rounded-sm border border-(--border-color)"
      aria-hidden="true"
    />
  );
}

function LanguageIcon({ language }: { language: Language }) {
  switch (language) {
    case "en":
      return <Flag src="/images/flags/gb.svg" alt="" />;
    case "sr":
      return (
        <span className="inline-flex gap-0.5">
          <Flag src="/images/flags/ba.svg" alt="" />
          <Flag src="/images/flags/hr.svg" alt="" />
          <Flag src="/images/flags/rs.svg" alt="" />
        </span>
      );
    default:
      return <GlobeIcon className="text-lg" />;
  }
}

function getLabelKey(language: Language): string {
  switch (language) {
    case "system":
      return "language.system";
    case "en":
      return "language.english";
    case "sr":
      return "language.bcs";
  }
}

function getNotificationKey(language: Language): string {
  switch (language) {
    case "system":
      return "language.switched.system";
    case "en":
      return "language.switched.english";
    case "sr":
      return "language.switched.bcs";
  }
}

function LanguageSwitcher({
  setLanguage,
  language,
}: {
  setLanguage: SetLanguage;
  language: Language;
}) {
  const { addNotification, t } = use(RootContext);

  function handleLanguageToggle() {
    const currentIndex = languageOrder.indexOf(language);
    const nextLanguage =
      languageOrder[(currentIndex + 1) % languageOrder.length];

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
      <span>{t("nav.language")}</span>
    </button>
  );
}

export { LanguageSwitcher };
