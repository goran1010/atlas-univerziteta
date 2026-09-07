import { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import {
  THEME_STORAGE_KEY,
  isTheme,
  readStoredTheme,
  writeStoredTheme,
} from "../utils/theme";

import type { ReactNode } from "react";
import type { ResolvedTheme, Theme } from "../utils/theme";

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  const resolvedTheme: ResolvedTheme =
    theme === "dark" || (theme === "system" && systemDark) ? "dark" : "light";

  useEffect(() => {
    writeStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      setSystemDark(media.matches);
    };

    media.addEventListener("change", listener);
    return () => {
      media.removeEventListener("change", listener);
    };
  }, []);

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      /* A null key means the other tab called localStorage.clear() */
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
      setTheme(isTheme(event.newValue) ? event.newValue : "system");
    };

    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
    };
  }, []);

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

export { ThemeProvider };
