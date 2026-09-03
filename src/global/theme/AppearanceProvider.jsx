import { useEffect, useState, useMemo, useCallback } from "react";
import { STORAGE_KEY, ACCENT_COLORS, THEME_OPTIONS, DEFAULT_SETTINGS } from "./appearance-constants";
import { AppearanceContext } from "./appearance-context";

function getInitialSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        theme: parsed.theme || DEFAULT_SETTINGS.theme,
        accentColor: parsed.accentColor || DEFAULT_SETTINGS.accentColor,
      };
    }
  } catch (e) {
    console.error("Failed to load appearance settings from localStorage", e);
  }
  return DEFAULT_SETTINGS;
}

export function AppearanceProvider({ children }) {
  const [settings, setSettings] = useState(getInitialSettings);
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Watch system color scheme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme = useMemo(() => {
    if (settings.theme === "system") {
      return systemIsDark ? "dark" : "light";
    }
    return settings.theme;
  }, [settings.theme, systemIsDark]);

  // Apply .dark class to root element
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Apply data-accent attribute to root element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.accentColor) {
      root.setAttribute("data-accent", settings.accentColor);
    }
  }, [settings.accentColor]);

  // Persist settings to localStorage
  const setTheme = useCallback((newTheme) => {
    setSettings((prev) => {
      const updated = { ...prev, theme: newTheme };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to persist appearance settings", e);
      }
      return updated;
    });
  }, []);

  const setAccentColor = useCallback((newAccentColor) => {
    setSettings((prev) => {
      const updated = { ...prev, accentColor: newAccentColor };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to persist appearance settings", e);
      }
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme: settings.theme,
      setTheme,
      accentColor: settings.accentColor,
      setAccentColor,
      resolvedTheme,
      accentColors: ACCENT_COLORS,
      themeOptions: THEME_OPTIONS,
    }),
    [settings.theme, settings.accentColor, resolvedTheme, setTheme, setAccentColor]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export default AppearanceProvider;
