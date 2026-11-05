import { getTenantSlug } from "@/global/utils/tenant";

const STYLE_ELEMENT_ID = "hq-tenant-branding";
const BRANDING_CACHE_PREFIX = "hq_branding_";
const THEME_MODE_KEY = "hq_theme_mode";
const FONT_SIZE_KEY = "hq_font_size";

export const FONT_SIZE_SCALE = {
  compact: { label: "Compact", px: "14px", desc: "Dense view for high-information screens" },
  default: { label: "Default", px: "16px", desc: "Balanced standard workspace typography" },
  comfortable: { label: "Comfortable", px: "17px", desc: "Slightly larger text for relaxed reading" },
  large: { label: "Large", px: "18px", desc: "Maximum legibility across all panels" },
};

/**
 * Maps flat/nested theme schema keys from TenantBranding to CSS custom property names in index.css
 */
const THEME_VAR_MAP = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

const PRIMARY_SIDEBAR_VAR_MAP = {
  background: "--primary-sidebar",
  border: "--primary-sidebar-border",
  text: "--primary-sidebar-text",
  active: "--primary-sidebar-active",
  activeText: "--primary-sidebar-active-text",
  marker: "--primary-sidebar-marker",
};

const STATUS_VAR_MAP = {
  liveBackground: "--status-live-bg",
  liveForeground: "--status-live-fg",
  liveBorder: "--status-live-border",
  warnBackground: "--status-warn-bg",
  warnForeground: "--status-warn-fg",
  warnBorder: "--status-warn-border",
};

const MEET_VAR_MAP = {
  surface: "--meet-surface",
  surfaceBorder: "--meet-surface-border",
  avatarLocal: "--meet-avatar-local",
  avatarRemote: "--meet-avatar-remote",
};

const buildThemeDeclarations = (themeObj = {}) => {
  if (!themeObj || typeof themeObj !== "object") return [];
  const decls = [];

  for (const [key, cssVar] of Object.entries(THEME_VAR_MAP)) {
    if (themeObj[key]) {
      decls.push(`${cssVar}: ${themeObj[key]};`);
    }
  }

  if (themeObj.primarySidebar && typeof themeObj.primarySidebar === "object") {
    for (const [key, cssVar] of Object.entries(PRIMARY_SIDEBAR_VAR_MAP)) {
      if (themeObj.primarySidebar[key]) {
        decls.push(`${cssVar}: ${themeObj.primarySidebar[key]};`);
      }
    }
  }

  if (themeObj.status && typeof themeObj.status === "object") {
    for (const [key, cssVar] of Object.entries(STATUS_VAR_MAP)) {
      if (themeObj.status[key]) {
        decls.push(`${cssVar}: ${themeObj.status[key]};`);
      }
    }
  }

  return decls;
};

const buildDesignAndComponentDeclarations = (designTokens = {}, components = {}) => {
  const decls = [];

  if (designTokens && typeof designTokens === "object") {
    if (designTokens.fontSans) decls.push(`--font-sans: ${designTokens.fontSans};`);
    if (designTokens.fontHeading) decls.push(`--font-heading: ${designTokens.fontHeading};`);
    if (typeof designTokens.radius === "number") decls.push(`--radius: ${designTokens.radius}rem;`);
    if (designTokens.shadowCard) decls.push(`--shadow-card: ${designTokens.shadowCard};`);
    if (designTokens.shadowPopover) decls.push(`--shadow-popover: ${designTokens.shadowPopover};`);
    if (designTokens.shadowModal) decls.push(`--shadow-modal: ${designTokens.shadowModal};`);
  }

  if (components?.meet && typeof components.meet === "object") {
    for (const [key, cssVar] of Object.entries(MEET_VAR_MAP)) {
      if (components.meet[key]) {
        decls.push(`${cssVar}: ${components.meet[key]};`);
      }
    }
  }

  return decls;
};

/**
 * Generates a single CSS stylesheet string for both `:root` and `.dark`
 * and injects it into `<head>` via `<style id="hq-tenant-branding">`.
 * Also updates the document favicon and title if provided in `identity`.
 */
export const applyBrandingToDom = (brandingData) => {
  if (typeof document === "undefined" || !brandingData) return;

  const lightDecls = [
    ...buildThemeDeclarations(brandingData.themes?.light),
    ...buildDesignAndComponentDeclarations(brandingData.designTokens, brandingData.components),
  ];

  const darkDecls = [
    ...buildThemeDeclarations(brandingData.themes?.dark),
    ...buildDesignAndComponentDeclarations(null, brandingData.components),
  ];

  let styleEl = document.getElementById(STYLE_ELEMENT_ID);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleEl);
  }

  const rootRule = lightDecls.length ? `:root {\n  ${lightDecls.join("\n  ")}\n}` : "";
  const darkRule = darkDecls.length ? `.dark {\n  ${darkDecls.join("\n  ")}\n}` : "";
  styleEl.textContent = [rootRule, darkRule].filter(Boolean).join("\n\n");

  // Update favicon if present
  if (brandingData.identity?.favicon) {
    let iconLink = document.querySelector("link[rel~='icon']");
    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }
    if (iconLink.href !== brandingData.identity.favicon) {
      iconLink.href = brandingData.identity.favicon;
    }
  }

  // Update document title if companyName is present
  if (brandingData.identity?.companyName) {
    document.title = brandingData.identity.companyName;
  }
};

/**
 * Applies `light`, `dark`, or `system` class onto `document.documentElement`
 */
export const applyThemeModeToDom = (mode = "system") => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolvedDark =
    mode === "dark" ||
    (mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", Boolean(resolvedDark));
};

export const getStoredThemeMode = (fallbackMode = "system") => {
  if (typeof localStorage === "undefined") return fallbackMode;
  return localStorage.getItem(THEME_MODE_KEY) || fallbackMode;
};

export const setStoredThemeMode = (mode) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(THEME_MODE_KEY, mode);
  }
  applyThemeModeToDom(mode);
};

export const applyFontSizeToDom = (sizeKey = "default") => {
  if (typeof document === "undefined") return;
  const entry = FONT_SIZE_SCALE[sizeKey] || FONT_SIZE_SCALE.default;
  document.documentElement.style.fontSize = entry.px;
};

export const getStoredFontSize = (fallbackSize = "default") => {
  if (typeof localStorage === "undefined") return fallbackSize;
  const stored = localStorage.getItem(FONT_SIZE_KEY);
  return stored && FONT_SIZE_SCALE[stored] ? stored : fallbackSize;
};

export const setStoredFontSize = (sizeKey) => {
  const validKey = FONT_SIZE_SCALE[sizeKey] ? sizeKey : "default";
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(FONT_SIZE_KEY, validKey);
  }
  applyFontSizeToDom(validKey);
};

export const getCachedBranding = (slug) => {
  if (!slug || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${BRANDING_CACHE_PREFIX}${slug.toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedBranding = (slug, brandingData) => {
  if (!slug || !brandingData || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      `${BRANDING_CACHE_PREFIX}${slug.toLowerCase()}`,
      JSON.stringify(brandingData)
    );
  } catch {
    // ignore quota errors
  }
};

/**
 * Stage 1 (Pre-React Mount): Synchronously reads cached branding for the current tenant
 * slug from localStorage and injects `<style id="hq-tenant-branding">` before the first frame paints.
 * Eliminates Flash of Default Theme (0ms network wait).
 */
export const hydrateCachedBranding = () => {
  const slug = getTenantSlug();
  const cached = getCachedBranding(slug);

  if (cached) {
    applyBrandingToDom(cached);
  }

  const preferredMode = getStoredThemeMode(cached?.settings?.defaultMode || "system");
  applyThemeModeToDom(preferredMode);

  const preferredFontSize = getStoredFontSize("default");
  applyFontSizeToDom(preferredFontSize);

  return cached;
};

