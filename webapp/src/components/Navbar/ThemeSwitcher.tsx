import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { useTheme } from "../../customHooks/useTheme";
import { THEMES } from "../../utils/theme";

import type { Theme } from "../../utils/theme";

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function getThemeIcon(theme: Theme) {
  switch (theme) {
    case "light":
      return <SunIcon />;
    case "dark":
      return <MoonIcon />;
    default:
      return <MonitorIcon />;
  }
}

function ThemeSwitcher() {
  const { addNotification, t } = use(RootContext);
  const { theme, setTheme } = useTheme();

  function handleThemeToggle() {
    const currentIndex = THEMES.indexOf(theme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];

    setTheme(nextTheme);
    addNotification({
      type: "info",
      message: t(`theme.switched.${nextTheme}`),
    });
  }

  const themeLabel = t(`theme.${theme}`);

  return (
    <button
      type="button"
      id="theme-switcher"
      aria-label={`${t("nav.toggleThemeAria")} - ${themeLabel}`}
      onClick={handleThemeToggle}
      className="min-w-20 w-full md:w-fit relative inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-semibold transition transform hover:cursor-pointer
        bg-(--surface-1) text-(--text-primary) border border-(--border-color) shadow-(--card-shadow-soft)
        hover:bg-(--hover-surface) hover:shadow-(--card-shadow) active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
    >
      {getThemeIcon(theme)}
      <span>{t("nav.theme")}</span>
    </button>
  );
}

export { ThemeSwitcher };
