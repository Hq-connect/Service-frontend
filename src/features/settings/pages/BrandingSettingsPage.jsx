import { useState, useEffect } from "react";
import {
  Palette,
  Upload,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Video,
  Sun,
  Moon,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SettingsSectionCard from "../components/SettingsSectionCard";
import useBrandingSettings from "../hooks/useBrandingSettings";

function ColorTokenInput({ label, value, onChange, hint }) {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#111113";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {hint && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative size-8 rounded-lg border border-border overflow-hidden shrink-0 cursor-pointer shadow-2xs">
          <input
            type="color"
            value={safeHex}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute -inset-2 size-12 cursor-pointer opacity-0"
          />
          <span
            className="block size-full"
            style={{ backgroundColor: value || "#111113" }}
          />
        </label>
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#111113"
          className="font-mono text-xs uppercase"
        />
      </div>
    </div>
  );
}

const DEFAULT_LIGHT = {
  background: "#FAF9F6",
  foreground: "#111113",
  card: "#FFFFFF",
  primary: "#111113",
  secondary: "#F2F0EB",
  muted: "#F3F2EE",
  accent: "#ECEAE3",
  border: "#E6E4DD",
  primarySidebar: {
    background: "#111113",
    border: "#222226",
    text: "#8E8E96",
    active: "#232329",
    activeText: "#FFFFFF",
    marker: "#E11D48",
  },
};

const DEFAULT_DARK = {
  background: "#0C0C0E",
  foreground: "#F4F4F6",
  card: "#141417",
  primary: "#F4F4F6",
  secondary: "#1D1D22",
  muted: "#1A1A1F",
  accent: "#232329",
  border: "#242429",
  primarySidebar: {
    background: "#08080A",
    border: "#1A1A1F",
    text: "#787882",
    active: "#1C1C22",
    activeText: "#FFFFFF",
    marker: "#FB7185",
  },
};

export function BrandingSettingsPage() {
  const {
    branding,
    isLoading,
    updateIdentity,
    isUpdatingIdentity,
    updateTheme,
    isUpdatingTheme,
    updateMeetingTheme,
    isUpdatingMeeting,
    resetBranding,
    isResetting,
    previewBranding,
  } = useBrandingSettings();

  // 1. Identity Form State
  const [identityForm, setIdentityForm] = useState({
    companyName: "",
    brandPrimary: "#111113",
    brandSecondary: "#F2F0EB",
    brandAccent: "#E11D48",
  });
  const [identityFiles, setIdentityFiles] = useState({
    logo: null,
    logoDark: null,
    favicon: null,
  });
  const [filePreviews, setFilePreviews] = useState({
    logo: null,
    logoDark: null,
    favicon: null,
  });
  const [identityFeedback, setIdentityFeedback] = useState(null);

  // 2. Theme Tokens State
  const [editingMode, setEditingMode] = useState("light");
  const [themesForm, setThemesForm] = useState({
    light: DEFAULT_LIGHT,
    dark: DEFAULT_DARK,
  });
  const [themeFeedback, setThemeFeedback] = useState(null);

  // 3. Meeting Surface State
  const [meetingForm, setMeetingForm] = useState({
    surface: "#18181B",
    surfaceBorder: "#27272A",
    avatarLocal: "#3F3F46",
    avatarRemote: "#27272A",
  });
  const [meetingFeedback, setMeetingFeedback] = useState(null);

  // 4. Reset State
  const [resetIdentityToo, setResetIdentityToo] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(null);

  useEffect(() => {
    if (!branding) return;

    setIdentityForm({
      companyName: branding.identity?.companyName || "",
      brandPrimary: branding.identity?.brandPrimary || "#111113",
      brandSecondary: branding.identity?.brandSecondary || "#F2F0EB",
      brandAccent: branding.identity?.brandAccent || "#E11D48",
    });

    setThemesForm({
      light: {
        ...DEFAULT_LIGHT,
        ...(branding.themes?.light || {}),
        primarySidebar: {
          ...DEFAULT_LIGHT.primarySidebar,
          ...(branding.themes?.light?.primarySidebar || {}),
        },
      },
      dark: {
        ...DEFAULT_DARK,
        ...(branding.themes?.dark || {}),
        primarySidebar: {
          ...DEFAULT_DARK.primarySidebar,
          ...(branding.themes?.dark?.primarySidebar || {}),
        },
      },
    });

    const meetSource = branding.components?.meet || branding.meeting || {};
    setMeetingForm({
      surface: meetSource.surface || "#18181B",
      surfaceBorder: meetSource.surfaceBorder || "#27272A",
      avatarLocal: meetSource.avatarLocal || "#3F3F46",
      avatarRemote: meetSource.avatarRemote || "#27272A",
    });
  }, [branding]);

  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [filePreviews]);

  const handleFileSelect = (slot, file) => {
    if (!file) return;
    setIdentityFeedback(null);
    const url = URL.createObjectURL(file);
    setIdentityFiles((prev) => ({ ...prev, [slot]: file }));
    setFilePreviews((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot]);
      return { ...prev, [slot]: url };
    });
  };

  const handleIdentitySave = async (e) => {
    e.preventDefault();
    setIdentityFeedback(null);
    try {
      await updateIdentity({
        fields: identityForm,
        files: identityFiles,
      });
      setIdentityFiles({ logo: null, logoDark: null, favicon: null });
      setIdentityFeedback({
        type: "success",
        message: "Brand identity and logos published to CDN.",
      });
    } catch (err) {
      setIdentityFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to update brand identity.",
      });
    }
  };

  const handleThemeTokenChange = (key, value) => {
    setThemeFeedback(null);
    setThemesForm((prev) => ({
      ...prev,
      [editingMode]: {
        ...prev[editingMode],
        [key]: value,
      },
    }));
  };

  const handleRailTokenChange = (key, value) => {
    setThemeFeedback(null);
    setThemesForm((prev) => ({
      ...prev,
      [editingMode]: {
        ...prev[editingMode],
        primarySidebar: {
          ...prev[editingMode].primarySidebar,
          [key]: value,
        },
      },
    }));
  };

  const handleLivePreview = () => {
    previewBranding({
      ...branding,
      identity: { ...branding?.identity, ...identityForm },
      themes: themesForm,
      meeting: meetingForm,
    });
    setThemeFeedback({
      type: "success",
      message: "Live preview applied to DOM. Save to publish for all members.",
    });
  };

  const handleSaveTheme = async () => {
    setThemeFeedback(null);
    try {
      await updateTheme({
        mode: "both",
        light: themesForm.light,
        dark: themesForm.dark,
      });
      setThemeFeedback({
        type: "success",
        message: "Light & Dark workspace themes published.",
      });
    } catch (err) {
      setThemeFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to save theme tokens.",
      });
    }
  };

  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    setMeetingFeedback(null);
    try {
      await updateMeetingTheme(meetingForm);
      setMeetingFeedback({
        type: "success",
        message: "Meeting room surface tokens saved.",
      });
    } catch (err) {
      setMeetingFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to update meeting tokens.",
      });
    }
  };

  const handleReset = async () => {
    setResetFeedback(null);
    try {
      await resetBranding({ resetIdentity: resetIdentityToo });
      setResetFeedback({
        type: "success",
        message: "Workspace branding restored to HQ Connect platform defaults.",
      });
    } catch (err) {
      setResetFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to reset branding.",
      });
    }
  };

  if (isLoading && !branding) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-56 rounded-md bg-muted" />
        <div className="h-72 rounded-xl bg-muted/60 border border-border" />
        <div className="h-96 rounded-xl bg-muted/60 border border-border" />
      </div>
    );
  }

  const activeTokens = themesForm[editingMode];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Branding & theme
            </h1>
            {branding?.version && (
              <Badge variant="outline" className="font-mono text-[11px] tabular-nums">
                v{branding.version}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Customize your workspace logos and the Light & Dark palettes used across all member devices.
          </p>
        </div>
      </div>

      {/* SECTION 1: Brand Identity & Logos */}
      <form onSubmit={handleIdentitySave}>
        <SettingsSectionCard
          title="Brand identity & logos"
          description="Your dark logo is displayed in the Primary Sidebar rail; the light logo is used on light surfaces. If none is uploaded, the HQ Connect emblem is used."
          footer={
            <>
              <div className="text-xs">
                {identityFeedback ? (
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium ${
                      identityFeedback.type === "error"
                        ? "text-destructive"
                        : "text-status-live-foreground"
                    }`}
                  >
                    {identityFeedback.type === "error" ? (
                      <AlertCircle className="size-3.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="size-3.5 shrink-0" />
                    )}
                    {identityFeedback.message}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Supports SVG, PNG, WebP, or ICO up to 5 MB per asset.
                  </span>
                )}
              </div>
              <Button type="submit" size="sm" disabled={isUpdatingIdentity}>
                {isUpdatingIdentity ? "Publishing…" : "Save brand identity"}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            {/* Company Name + Brand Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Brand / company name
                </label>
                <Input
                  value={identityForm.companyName}
                  onChange={(e) =>
                    setIdentityForm((p) => ({
                      ...p,
                      companyName: e.target.value,
                    }))
                  }
                  placeholder="Acme Corp"
                  maxLength={100}
                />
              </div>

              <ColorTokenInput
                label="Brand primary"
                value={identityForm.brandPrimary}
                onChange={(v) =>
                  setIdentityForm((p) => ({ ...p, brandPrimary: v }))
                }
              />

              <ColorTokenInput
                label="Brand secondary"
                value={identityForm.brandSecondary}
                onChange={(v) =>
                  setIdentityForm((p) => ({ ...p, brandSecondary: v }))
                }
              />

              <ColorTokenInput
                label="Brand accent"
                value={identityForm.brandAccent}
                onChange={(v) =>
                  setIdentityForm((p) => ({ ...p, brandAccent: v }))
                }
              />
            </div>

            {/* 3 Asset Upload Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Primary Logo (Light surface) */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Primary logo (Light)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Displayed on light headers and auth screens.
                  </p>
                </div>

                <div className="h-16 rounded-lg border border-border bg-background flex items-center justify-center p-2">
                  {filePreviews.logo || branding?.identity?.logo ? (
                    <img
                      src={filePreviews.logo || branding?.identity?.logo}
                      alt="Light logo preview"
                      className="max-h-10 max-w-full object-contain"
                    />
                  ) : (
                    <Logo iconOnly={false} isDark={false} forceDefault className="h-6 w-auto" />
                  )}
                </div>

                <label className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer transition-colors">
                  <Upload className="size-3.5" />
                  <span>
                    {identityFiles.logo ? identityFiles.logo.name : "Choose file"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) =>
                      handleFileSelect("logo", e.target.files?.[0])
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {/* Dark Rail Logo */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Sidebar rail logo (Dark)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Shown inside the 72px Primary Sidebar rail.
                  </p>
                </div>

                <div className="h-16 rounded-lg border border-primary-sidebar-border bg-primary-sidebar flex items-center justify-center p-2">
                  {filePreviews.logoDark || branding?.identity?.logoDark ? (
                    <img
                      src={
                        filePreviews.logoDark || branding?.identity?.logoDark
                      }
                      alt="Dark logo preview"
                      className="max-h-9 max-w-full object-contain"
                    />
                  ) : (
                    <Logo iconOnly isDark forceDefault className="size-7" />
                  )}
                </div>

                <label className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer transition-colors">
                  <Upload className="size-3.5" />
                  <span>
                    {identityFiles.logoDark
                      ? identityFiles.logoDark.name
                      : "Choose file"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) =>
                      handleFileSelect("logoDark", e.target.files?.[0])
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {/* Favicon */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Browser favicon
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    32×32 or SVG icon shown in browser tabs.
                  </p>
                </div>

                <div className="h-16 rounded-lg border border-border bg-background flex items-center justify-center p-2">
                  {filePreviews.favicon || branding?.identity?.favicon ? (
                    <img
                      src={filePreviews.favicon || branding?.identity?.favicon}
                      alt="Favicon preview"
                      className="size-8 object-contain"
                    />
                  ) : (
                    <Logo iconOnly isDark={false} forceDefault className="size-7" />
                  )}
                </div>

                <label className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer transition-colors">
                  <Upload className="size-3.5" />
                  <span>
                    {identityFiles.favicon
                      ? identityFiles.favicon.name
                      : "Choose file"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                    onChange={(e) =>
                      handleFileSelect("favicon", e.target.files?.[0])
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </SettingsSectionCard>
      </form>

      {/* SECTION 2: Light & Dark Theme Tokens */}
      <SettingsSectionCard
        title="Workspace theme palettes"
        description="Configure the semantic tokens for Light and Dark modes. Members choose between these two palettes in their personal Appearance settings."
        headerAction={
          <Tabs value={editingMode} onValueChange={setEditingMode}>
            <TabsList>
              <TabsTrigger value="light" className="gap-1.5 text-xs px-2.5">
                <Sun className="size-3.5" />
                Light palette
              </TabsTrigger>
              <TabsTrigger value="dark" className="gap-1.5 text-xs px-2.5">
                <Moon className="size-3.5" />
                Dark palette
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        footer={
          <>
            <div className="text-xs">
              {themeFeedback ? (
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    themeFeedback.type === "error"
                      ? "text-destructive"
                      : "text-status-live-foreground"
                  }`}
                >
                  {themeFeedback.type === "error" ? (
                    <AlertCircle className="size-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  )}
                  {themeFeedback.message}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Use &ldquo;Live preview&rdquo; to inspect changes before publishing to CDN.
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLivePreview}
              >
                <Eye className="size-3.5 mr-1.5" />
                Live preview
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUpdatingTheme}
                onClick={handleSaveTheme}
              >
                <Palette className="size-3.5 mr-1.5" />
                {isUpdatingTheme ? "Publishing…" : "Publish themes"}
              </Button>
            </div>
          </>
        }
      >
        <div className="space-y-6">
          {/* Core Surfaces */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Core surfaces ({editingMode} mode)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ColorTokenInput
                label="Background canvas"
                hint="--background"
                value={activeTokens.background}
                onChange={(v) => handleThemeTokenChange("background", v)}
              />
              <ColorTokenInput
                label="Primary ink"
                hint="--foreground"
                value={activeTokens.foreground}
                onChange={(v) => handleThemeTokenChange("foreground", v)}
              />
              <ColorTokenInput
                label="Card surface"
                hint="--card"
                value={activeTokens.card}
                onChange={(v) => handleThemeTokenChange("card", v)}
              />
              <ColorTokenInput
                label="Primary interactive"
                hint="--primary"
                value={activeTokens.primary}
                onChange={(v) => handleThemeTokenChange("primary", v)}
              />
              <ColorTokenInput
                label="Secondary surface"
                hint="--secondary"
                value={activeTokens.secondary}
                onChange={(v) => handleThemeTokenChange("secondary", v)}
              />
              <ColorTokenInput
                label="Muted well"
                hint="--muted"
                value={activeTokens.muted}
                onChange={(v) => handleThemeTokenChange("muted", v)}
              />
              <ColorTokenInput
                label="Accent highlight"
                hint="--accent"
                value={activeTokens.accent}
                onChange={(v) => handleThemeTokenChange("accent", v)}
              />
              <ColorTokenInput
                label="Hairline border"
                hint="--border"
                value={activeTokens.border}
                onChange={(v) => handleThemeTokenChange("border", v)}
              />
            </div>
          </div>

          {/* Primary Sidebar Rail */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Primary sidebar rail ({editingMode} mode)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorTokenInput
                label="Rail background"
                value={activeTokens.primarySidebar?.background}
                onChange={(v) => handleRailTokenChange("background", v)}
              />
              <ColorTokenInput
                label="Rail border"
                value={activeTokens.primarySidebar?.border}
                onChange={(v) => handleRailTokenChange("border", v)}
              />
              <ColorTokenInput
                label="Inactive icon text"
                value={activeTokens.primarySidebar?.text}
                onChange={(v) => handleRailTokenChange("text", v)}
              />
              <ColorTokenInput
                label="Active item pill"
                value={activeTokens.primarySidebar?.active}
                onChange={(v) => handleRailTokenChange("active", v)}
              />
              <ColorTokenInput
                label="Active icon text"
                value={activeTokens.primarySidebar?.activeText}
                onChange={(v) => handleRailTokenChange("activeText", v)}
              />
              <ColorTokenInput
                label="Active signal marker"
                value={activeTokens.primarySidebar?.marker}
                onChange={(v) => handleRailTokenChange("marker", v)}
              />
            </div>
          </div>
        </div>
      </SettingsSectionCard>

      {/* SECTION 3: Meeting Room Surface Tokens */}
      <form onSubmit={handleSaveMeeting}>
        <SettingsSectionCard
          title="Meeting room stage"
          description="Always-dark cinema surface tokens used for video tiles and audio stages in HQ Meets."
          footer={
            <>
              <div className="text-xs">
                {meetingFeedback ? (
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium ${
                      meetingFeedback.type === "error"
                        ? "text-destructive"
                        : "text-status-live-foreground"
                    }`}
                  >
                    {meetingFeedback.type === "error" ? (
                      <AlertCircle className="size-3.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="size-3.5 shrink-0" />
                    )}
                    {meetingFeedback.message}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Applied to live video grids and participant tiles.
                  </span>
                )}
              </div>
              <Button type="submit" size="sm" disabled={isUpdatingMeeting}>
                <Video className="size-3.5 mr-1.5" />
                {isUpdatingMeeting ? "Saving…" : "Save meeting stage"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ColorTokenInput
              label="Stage surface"
              value={meetingForm.surface}
              onChange={(v) =>
                setMeetingForm((p) => ({ ...p, surface: v }))
              }
            />
            <ColorTokenInput
              label="Tile border"
              value={meetingForm.surfaceBorder}
              onChange={(v) =>
                setMeetingForm((p) => ({ ...p, surfaceBorder: v }))
              }
            />
            <ColorTokenInput
              label="Local avatar well"
              value={meetingForm.avatarLocal}
              onChange={(v) =>
                setMeetingForm((p) => ({ ...p, avatarLocal: v }))
              }
            />
            <ColorTokenInput
              label="Remote avatar well"
              value={meetingForm.avatarRemote}
              onChange={(v) =>
                setMeetingForm((p) => ({ ...p, avatarRemote: v }))
              }
            />
          </div>
        </SettingsSectionCard>
      </form>

      {/* SECTION 4: Reset to Platform Defaults */}
      <SettingsSectionCard
        danger
        title="Reset to platform defaults"
        description="Restore Warm Alabaster (Light) and Carbon Obsidian (Dark) architectural palettes."
        footer={
          <>
            <div className="text-xs">
              {resetFeedback ? (
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    resetFeedback.type === "error"
                      ? "text-destructive"
                      : "text-status-live-foreground"
                  }`}
                >
                  {resetFeedback.message}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Publishes a new branding.json snapshot immediately.
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isResetting}
              onClick={handleReset}
            >
              <RotateCcw className="size-3.5 mr-1.5" />
              {isResetting ? "Resetting…" : "Reset workspace branding"}
            </Button>
          </>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              Also clear uploaded logos and company name
            </p>
            <p className="text-xs text-muted-foreground">
              When enabled, the sidebar and headers revert to the default HQ Connect vector emblem.
            </p>
          </div>
          <Switch
            checked={resetIdentityToo}
            onCheckedChange={setResetIdentityToo}
          />
        </div>
      </SettingsSectionCard>
    </div>
  );
}

export default BrandingSettingsPage;

