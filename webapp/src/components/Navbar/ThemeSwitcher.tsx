import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { useTheme } from "../../customHooks/useTheme";
import { THEMES } from "../../utils/theme";
import { Select } from "../sharedComponents/Select";

function ThemeSwitcher() {
  const { t } = use(RootContext);
  const { theme, setTheme } = useTheme();
  const label = t("nav.theme");

  return (
    <Select
      id="theme-switcher"
      aria-label={label}
      compact
      className="md:flex-none"
      value={theme}
      onChange={(e) => {
        const next = THEMES.find((option) => option === e.target.value);
        if (next) setTheme(next);
      }}
    >
      {THEMES.map((option) => (
        <option key={option} value={option}>
          {label}: {t(`theme.${option}`)}
        </option>
      ))}
    </Select>
  );
}

export { ThemeSwitcher };
