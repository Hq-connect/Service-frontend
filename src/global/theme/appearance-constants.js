export const STORAGE_KEY = "appearance_settings";

export const ACCENT_COLORS = [
  { id: "blue", label: "Blue", color: "#3b82f6" },
  { id: "violet", label: "Violet", color: "#8b5cf6" },
  { id: "green", label: "Green", color: "#22c55e" },
  { id: "rose", label: "Rose", color: "#f43f5e" },
];

export const THEME_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

export const DEFAULT_SETTINGS = {
  theme: "system",
  accentColor: "blue",
};
