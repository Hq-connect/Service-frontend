import { useState, useEffect } from "react";
import {
  Building2,
  Copy,
  Check,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import SettingsSectionCard from "../components/SettingsSectionCard";
import useWorkspaceSettings from "../hooks/useWorkspaceSettings";

const WORKSPACE_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
];

const WORKSPACE_LANGUAGES = [
  { code: "en", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
];

const DOMAIN_REGEX =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export function WorkspaceGeneralPage() {
  const { workspace, isLoading, updateWorkspace, isUpdating } =
    useWorkspaceSettings();

  const [form, setForm] = useState({
    name: "",
    timezone: "UTC",
    language: "en",
    allowedEmailDomains: [],
  });
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState("");
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!workspace) return;
    const domains =
      workspace.allowedEmailDomains ??
      workspace.settings?.allowedEmailDomains ??
      [];
    setForm({
      name: workspace.name || "",
      timezone: workspace.timezone || workspace.settings?.timezone || "UTC",
      language: workspace.language || workspace.settings?.language || "en",
      allowedEmailDomains: Array.isArray(domains) ? domains : [],
    });
  }, [workspace]);

  const handleCopySlug = () => {
    if (!workspace?.slug) return;
    navigator.clipboard.writeText(workspace.slug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 1800);
  };

  const handleAddDomain = () => {
    setDomainError("");
    const cleaned = domainInput
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    if (!cleaned) return;
    if (!DOMAIN_REGEX.test(cleaned)) {
      setDomainError("Enter a valid domain such as acme.com");
      return;
    }
    if (form.allowedEmailDomains.includes(cleaned)) {
      setDomainError("Domain is already on the allowlist.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      allowedEmailDomains: [...prev.allowedEmailDomains, cleaned],
    }));
    setDomainInput("");
    setFeedback(null);
  };

  const handleRemoveDomain = (domain) => {
    setForm((prev) => ({
      ...prev,
      allowedEmailDomains: prev.allowedEmailDomains.filter((d) => d !== domain),
    }));
    setFeedback(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (form.name.trim().length < 2) {
      setFeedback({
        type: "error",
        message: "Workspace name must be at least 2 characters.",
      });
      return;
    }

    try {
      await updateWorkspace({
        name: form.name.trim(),
        settings: {
          timezone: form.timezone,
          language: form.language,
          allowedEmailDomains: form.allowedEmailDomains,
        },
      });
      setFeedback({
        type: "success",
        message: "Workspace settings saved.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Failed to update workspace settings.",
      });
    }
  };

  if (isLoading && !workspace) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-64 rounded-xl bg-muted/60 border border-border" />
        <div className="h-52 rounded-xl bg-muted/60 border border-border" />
      </div>
    );
  }

  const timezoneOptions = WORKSPACE_TIMEZONES.includes(form.timezone)
    ? WORKSPACE_TIMEZONES
    : [form.timezone, ...WORKSPACE_TIMEZONES];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Workspace general
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure your organization identity, regional defaults, and domain access rules.
        </p>
      </div>

      {/* Identity & Regional Defaults */}
      <SettingsSectionCard
        title="Organization profile"
        description="Your workspace name and subdomain identifier used across invitations and URLs."
        badge={
          workspace?.status && (
            <Badge variant="outline" className="capitalize text-[10px]">
              {workspace.status}
            </Badge>
          )
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" />
                Workspace name
              </label>
              <Input
                value={form.name}
                onChange={(e) => {
                  setFeedback(null);
                  setForm((p) => ({ ...p, name: e.target.value }));
                }}
                placeholder="Acme Engineering"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Workspace slug
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={workspace?.slug || ""}
                  disabled
                  readOnly
                  className="font-mono text-xs opacity-75"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopySlug}
                  title="Copy workspace slug"
                >
                  {copiedSlug ? (
                    <Check className="size-3.5 text-status-live-foreground" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {workspace?.slug || "workspace"}.hqconnect.app
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                Default workspace timezone
              </label>
              <Select
                value={form.timezone}
                onValueChange={(val) => {
                  setFeedback(null);
                  setForm((p) => ({ ...p, timezone: val }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                Default language
              </label>
              <Select
                value={form.language}
                onValueChange={(val) => {
                  setFeedback(null);
                  setForm((p) => ({ ...p, language: val }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKSPACE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SettingsSectionCard>

      {/* Allowed Email Domains */}
      <SettingsSectionCard
        title="Allowed email domains"
        description="Restrict access requests to verified company domains (e.g., acme.com). Leave empty to allow access requests from any work email."
        footer={
          <>
            <div className="text-xs">
              {feedback ? (
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    feedback.type === "error"
                      ? "text-destructive"
                      : "text-status-live-foreground"
                  }`}
                >
                  {feedback.type === "error" ? (
                    <AlertCircle className="size-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  )}
                  {feedback.message}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Changes are recorded in the workspace audit log.
                </span>
              )}
            </div>
            <Button type="submit" size="sm" disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save workspace settings"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                placeholder="acme.com"
                value={domainInput}
                onChange={(e) => {
                  setDomainError("");
                  setDomainInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                className="font-mono text-xs"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleAddDomain}
              className="shrink-0"
            >
              <Plus className="size-3.5 mr-1" />
              Add domain
            </Button>
          </div>

          {domainError && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              {domainError}
            </p>
          )}

          {form.allowedEmailDomains.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground shrink-0" />
              <span>
                No domain restriction configured — any email domain can request access or be invited.
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {form.allowedEmailDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-1 text-xs font-mono text-foreground"
                >
                  @{domain}
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(domain)}
                    className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    aria-label={`Remove ${domain}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </SettingsSectionCard>
    </form>
  );
}

export default WorkspaceGeneralPage;

