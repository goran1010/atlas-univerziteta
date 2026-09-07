type Theme = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const THEMES = ["system", "light", "dark"] as const;

function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

/* The inline script in index.html mirrors this logic for the pre-paint
   theme application - keep the two in sync. */
function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch (error) {
    console.warn("Could not read theme from localStorage:", error);
    return "system";
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Could not save theme to localStorage:", error);
  }
}

export {
  THEME_STORAGE_KEY,
  THEMES,
  isTheme,
  readStoredTheme,
  writeStoredTheme,
};
export type { Theme, ResolvedTheme };
