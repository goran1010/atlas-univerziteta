import { useCallback, useEffect, useMemo, useState } from "react";
import en from "../locales/en.json";
import sr from "../locales/sr.json";
import sq from "../locales/sq.json";
import mk from "../locales/mk.json";
import {
  LANGUAGE_TAGS,
  SYSTEM_LANGUAGES,
  setSystemLanguage,
} from "../utils/setInitialLanguage";
import { createTCount } from "../utils/pluralize";
import type { SystemLanguage } from "../utils/setInitialLanguage";
import type { Language, TFunction } from "../types";

type TranslationValue = string | TranslationMap;

interface TranslationMap {
  [key: string]: TranslationValue;
}

const translations: Record<SystemLanguage, typeof en> = { en, sr, sq, mk };

const SAVED_LANGUAGES: Language[] = ["system", ...SYSTEM_LANGUAGES];

function getSavedLanguage(): Language {
  const savedLanguage = localStorage.getItem("language");
  return (
    SAVED_LANGUAGES.find((language) => language === savedLanguage) ?? "system"
  );
}

function useLanguage() {
  const [language, setLanguage] = useState<Language>(getSavedLanguage);

  const resolvedLanguage =
    language === "system" ? setSystemLanguage() : language;

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = LANGUAGE_TAGS[resolvedLanguage];
  }, [language, resolvedLanguage]);

  const t: TFunction = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let value: TranslationValue | undefined = translations[resolvedLanguage];

      for (const k of keys) {
        if (typeof value !== "object") return key;
        value = value[k];
      }

      if (typeof value !== "string") return key;

      return value;
    },
    [resolvedLanguage],
  );

  const tCount = useMemo(
    () => createTCount(t, LANGUAGE_TAGS[resolvedLanguage]),
    [t, resolvedLanguage],
  );

  return { language, setLanguage, t, tCount };
}

export { useLanguage };
