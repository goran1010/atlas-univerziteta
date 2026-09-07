import { createContext } from "react";

import type { ResolvedTheme, Theme } from "../utils/theme";

type SetTheme = (theme: Theme) => void;

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: SetTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: (prop) => prop,
});

export { ThemeContext };
export type { SetTheme, ThemeContextType };
