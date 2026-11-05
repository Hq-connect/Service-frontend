import api from "@/api/api";

const R2_PUBLIC_DOMAIN = (
  import.meta.env.VITE_R2_PUBLIC_DOMAIN ||
  "https://pub-f50d8137869742cd86afc7a4c378ff95.r2.dev"
).replace(/\/+$/, "");

const brandingService = {
  /**
   * Public CDN fetch of tenant branding.json keyed by tenantSlug.
   * Returns null if the tenant has not saved custom branding yet (404).
   */
  fetchPublicBrandingJson: async (tenantSlug) => {
    if (!tenantSlug) return null;
    const normalizedSlug = String(tenantSlug).toLowerCase().trim();
    const url = `${R2_PUBLIC_DOMAIN}/branding/${encodeURIComponent(normalizedSlug)}/branding.json?t=${Date.now()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  /**
   * Retrieves the full TenantBranding document and public JSON URL
   * GET /api/settings/branding
   */
  getBranding: async () => {
    const response = await api.get("/settings/branding");
    return response.data.data;
  },

  /**
   * Updates brand identity (companyName, brandPrimary, brandSecondary, brandAccent, logo, logoDark, favicon)
   * PATCH /api/settings/branding/identity (multipart/form-data)
   */
  updateIdentity: async (identityData) => {
    let payload = identityData;
    if (!(identityData instanceof FormData)) {
      const formData = new FormData();
      Object.entries(identityData || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      payload = formData;
    }

    const response = await api.patch("/settings/branding/identity", payload);
    return response.data.data;
  },

  /**
   * Updates light and/or dark theme tokens
   * PATCH /api/settings/branding/theme
   */
  updateTheme: async ({ light, dark }) => {
    const response = await api.patch("/settings/branding/theme", { light, dark });
    return response.data.data;
  },

  /**
   * Updates component-specific tokens (e.g. meet surfaces)
   * PATCH /api/settings/branding/components
   */
  updateComponents: async ({ meet }) => {
    const response = await api.patch("/settings/branding/components", { meet });
    return response.data.data;
  },

  /**
   * Resets branding tokens to platform defaults (optionally resetting identity as well)
   * POST /api/settings/branding/reset
   */
  resetBranding: async (resetIdentity = false) => {
    const response = await api.post("/settings/branding/reset", {
      resetIdentity: Boolean(resetIdentity),
    });
    return response.data.data;
  },
};

export default brandingService;

