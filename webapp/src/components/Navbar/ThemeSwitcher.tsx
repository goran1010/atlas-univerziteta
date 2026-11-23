import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { useTheme } from "../../customHooks/useTheme";
import { THEMES } from "../../utils/theme";
import { Select } from "../sharedComponents/Select";

function ThemeSwitcher({ id = "theme-switcher" }: { id?: string }) {
  const { t } = use(RootContext);
  const { theme, setTheme } = useTheme();
  const label = t("nav.theme");

  return (
    <Select
      id={id}
      aria-label={label}
      compact
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
