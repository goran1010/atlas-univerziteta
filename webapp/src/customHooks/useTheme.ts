import { use } from "react";
import { ThemeContext } from "../contextData/ThemeContext";

function useTheme() {
  return use(ThemeContext);
}

export { useTheme };
