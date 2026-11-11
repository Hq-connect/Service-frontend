import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTenantSlug } from "@/global/utils/tenant";
import brandingService from "../services/branding.service";
import { setHydratedBranding, setThemeMode, setFontSize } from "../states/settings.slice";
import {
  applyBrandingToDom,
  applyThemeModeToDom,
  applyFontSizeToDom,
  getCachedBranding,
  setCachedBranding,
} from "../utils/brandingCssInjector";

/**
 * Stage 2 (Non-blocking Background Revalidation):
 * Fetches `branding/{slug}/branding.json` from R2 CDN in the background.
 * Only touches the DOM and Redux state if `remote.version !== cached.version`
 * (or on the very first visit when no localStorage cache exists).
 */
export const useBootstrapBranding = () => {
  const dispatch = useDispatch();
  const brandingState = useSelector((state) => state.settings?.branding);
  const themeMode = brandingState?.themeMode || "system";
  const fontSize = brandingState?.fontSize || "default";

  const revalidateBranding = useCallback(async () => {
    const slug = getTenantSlug();
    if (!slug) return;

    const cached = getCachedBranding(slug);
    const remote = await brandingService.fetchPublicBrandingJson(slug);

    if (!remote) return;

    // Version-gated check: skip DOM writes & Redux updates if nothing changed
    if (cached && cached.version === remote.version) {
      return;
    }

    setCachedBranding(slug, remote);
    applyBrandingToDom(remote);
    dispatch(setHydratedBranding(remote));

    if (!localStorage.getItem("hq_theme_mode") && remote.settings?.defaultMode) {
      dispatch(setThemeMode(remote.settings.defaultMode));
    }
  }, [dispatch]);

  useEffect(() => {
    revalidateBranding();
  }, [revalidateBranding]);

  // Keep OS prefers-color-scheme listener in sync when mode === "system"
  useEffect(() => {
    applyThemeModeToDom(themeMode);

    if (themeMode !== "system" || typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyThemeModeToDom("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  useEffect(() => {
    applyFontSizeToDom(fontSize);
  }, [fontSize]);

  return {
    branding: brandingState,
    themeMode,
    fontSize,
    setThemeMode: (mode) => dispatch(setThemeMode(mode)),
    setFontSize: (sizeKey) => dispatch(setFontSize(sizeKey)),
    revalidateBranding,
  };
};

export default useBootstrapBranding;

