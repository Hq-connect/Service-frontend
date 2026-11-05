import { createSlice } from "@reduxjs/toolkit";
import { getTenantSlug } from "@/global/utils/tenant";
import {
  getCachedBranding,
  getStoredThemeMode,
  setStoredThemeMode,
  getStoredFontSize,
  setStoredFontSize,
} from "../utils/brandingCssInjector";

const initialSlug = getTenantSlug();
const initialCachedBranding = getCachedBranding(initialSlug);

const DEFAULT_USER_FILTERS = {
  page: 1,
  limit: 20,
  search: "",
  role: "",
  status: "",
};

const DEFAULT_INVITE_FILTERS = {
  page: 1,
  limit: 20,
  status: "pending",
};

const DEFAULT_AUDIT_LOG_FILTERS = {
  page: 1,
  limit: 20,
  action: "",
  targetType: "",
  actorId: "",
  from: "",
  to: "",
};

const initialState = {
  // Global Invite Modal (can be triggered from PrimarySidebar or Settings > Users)
  isInviteModalOpen: false,

  // Selected member ID for User Management detail drawer/dialog
  selectedUserId: null,

  // Table filters
  userFilters: { ...DEFAULT_USER_FILTERS },
  inviteFilters: { ...DEFAULT_INVITE_FILTERS },
  auditLogFilters: { ...DEFAULT_AUDIT_LOG_FILTERS },

  // Hydrated & live-preview branding state
  branding: {
    hydrated: Boolean(initialCachedBranding),
    version: initialCachedBranding?.version ?? null,
    identity: initialCachedBranding?.identity ?? null,
    themes: initialCachedBranding?.themes ?? null,
    components: initialCachedBranding?.components ?? null,
    designTokens: initialCachedBranding?.designTokens ?? null,
    settings: initialCachedBranding?.settings ?? { defaultMode: "system" },
    themeMode: getStoredThemeMode(initialCachedBranding?.settings?.defaultMode || "system"),
    fontSize: getStoredFontSize("default"),
    isDirtyPreview: false,
  },
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setInviteModalOpen: (state, action) => {
      state.isInviteModalOpen = Boolean(action.payload);
    },
    setSelectedUserId: (state, action) => {
      state.selectedUserId = action.payload || null;
    },

    // User filters
    setUserFilters: (state, action) => {
      state.userFilters = {
        ...state.userFilters,
        ...action.payload,
      };
    },
    resetUserFilters: (state) => {
      state.userFilters = { ...DEFAULT_USER_FILTERS };
    },

    // Invite filters
    setInviteFilters: (state, action) => {
      state.inviteFilters = {
        ...state.inviteFilters,
        ...action.payload,
      };
    },
    resetInviteFilters: (state) => {
      state.inviteFilters = { ...DEFAULT_INVITE_FILTERS };
    },

    // Audit log filters
    setAuditLogFilters: (state, action) => {
      state.auditLogFilters = {
        ...state.auditLogFilters,
        ...action.payload,
      };
    },
    resetAuditLogFilters: (state) => {
      state.auditLogFilters = { ...DEFAULT_AUDIT_LOG_FILTERS };
    },

    // Branding state
    setHydratedBranding: (state, action) => {
      const payload = action.payload;
      if (!payload) return;
      state.branding.hydrated = true;
      state.branding.version = payload.version ?? state.branding.version;
      state.branding.identity = payload.identity ?? state.branding.identity;
      state.branding.themes = payload.themes ?? state.branding.themes;
      state.branding.components = payload.components ?? state.branding.components;
      state.branding.designTokens = payload.designTokens ?? state.branding.designTokens;
      state.branding.settings = payload.settings ?? state.branding.settings;
      state.branding.isDirtyPreview = false;
    },
    setThemeMode: (state, action) => {
      const mode = action.payload || "system";
      state.branding.themeMode = mode;
      setStoredThemeMode(mode);
    },
    setFontSize: (state, action) => {
      const sizeKey = action.payload || "default";
      state.branding.fontSize = sizeKey;
      setStoredFontSize(sizeKey);
    },
    setBrandingDirtyPreview: (state, action) => {
      state.branding.isDirtyPreview = Boolean(action.payload);
    },
  },
});

export const {
  setInviteModalOpen,
  setSelectedUserId,
  setUserFilters,
  resetUserFilters,
  setInviteFilters,
  resetInviteFilters,
  setAuditLogFilters,
  resetAuditLogFilters,
  setHydratedBranding,
  setThemeMode,
  setFontSize,
  setBrandingDirtyPreview,
} = settingsSlice.actions;

export default settingsSlice.reducer;

