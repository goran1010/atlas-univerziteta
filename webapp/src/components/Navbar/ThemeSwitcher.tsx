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
      // compact for the navbar; the ! makes these win over Select's own text
      // size, padding and wrapping. The extra vertical padding with the
      // smaller phone text keeps it as tall as the menu button.
      className="md:flex-none truncate! text-xs! sm:text-sm! pl-2! pr-7! py-2.5! sm:py-2! bg-position-[right_0.5rem_center]!"
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
