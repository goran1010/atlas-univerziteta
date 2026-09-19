import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { useTheme } from "../../customHooks/useTheme";
import { THEMES } from "../../utils/theme";
import { SunIcon, MoonIcon, MonitorIcon } from "../sharedComponents/icons";

import type { Theme } from "../../utils/theme";

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
