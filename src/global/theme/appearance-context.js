import { createContext } from "react";
import { ACCENT_COLORS, THEME_OPTIONS } from "./appearance-constants";

export const AppearanceContext = createContext({
  theme: "system",
  setTheme: () => {},
  accentColor: "blue",
  setAccentColor: () => {},
  resolvedTheme: "light",
  accentColors: ACCENT_COLORS,
  themeOptions: THEME_OPTIONS,
});
