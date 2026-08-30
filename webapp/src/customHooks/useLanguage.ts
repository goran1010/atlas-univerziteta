import { useCallback, useEffect, useState } from "react";
import en from "../locales/en.json";
import sr from "../locales/sr.json";
import { setSystemLanguage } from "../utils/setInitialLanguage";
import type { SystemLanguage } from "../utils/setInitialLanguage";
import type { Language, TFunction } from "../types/i18n";

type TranslationValue = string | TranslationMap;

interface TranslationMap {
  [key: string]: TranslationValue;
}

const translations: Record<SystemLanguage, TranslationMap> = { en, sr };

function getSavedLanguage(): Language {
  const savedLanguage = localStorage.getItem("language");

  if (
    savedLanguage === "en" ||
    savedLanguage === "sr" ||
    savedLanguage === "system"
  ) {
    return savedLanguage;
  }

  return "system";
}

function useLanguage() {
  const [language, setLanguage] = useState<Language>(getSavedLanguage);

  const resolvedLanguage =
    language === "system" ? setSystemLanguage() : language;

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = resolvedLanguage;
  }, [language, resolvedLanguage]);

  const t: TFunction = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let value: TranslationValue = translations[resolvedLanguage];

      for (const k of keys) {
        if (typeof value !== "object") return key;
        value = value[k];
      }

      if (typeof value !== "string") return key;

      return value;
    },
    [resolvedLanguage],
  );

  return { language, setLanguage, t };
}

export { useLanguage };
