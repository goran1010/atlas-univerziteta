import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { useTheme } from "../../customHooks/useTheme";
import { THEMES } from "../../utils/theme";
import { SwitcherChip } from "./SwitcherChip";
import { MonitorIcon, MoonIcon, SunIcon } from "../sharedComponents/icons";

function ThemeIcon({ theme }: { theme: (typeof THEMES)[number] }) {
  if (theme === "light") return <SunIcon className="text-base" />;
  if (theme === "dark") return <MoonIcon className="text-base" />;
  return <MonitorIcon className="text-base" />;
}

function ThemeSwitcher() {
  const { t } = use(RootContext);
  const { theme, setTheme } = useTheme();
  const label = t("nav.theme");

  return (
    <SwitcherChip
      id="theme-switcher"
      aria-label={label}
      value={theme}
      onChange={(e) => {
        const next = THEMES.find((option) => option === e.target.value);
        if (next) setTheme(next);
      }}
      face={
        <>
          <ThemeIcon theme={theme} />
          {label}
        </>
      }
    >
      {THEMES.map((option) => (
        <option key={option} value={option}>
          {t(`theme.${option}`)}
        </option>
      ))}
    </SwitcherChip>
  );
}

export { ThemeSwitcher };
