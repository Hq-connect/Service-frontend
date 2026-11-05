import { useState, useEffect, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Globe,
  Code2,
  Briefcase,
  Link2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  getInitials,
  getUserDisplayName as getUserName,
  getAvatarStyle,
} from "@/global/utils/user";
import SettingsSectionCard from "../components/SettingsSectionCard";
import useMyProfile from "../hooks/useMyProfile";

const COMMON_TIMEZONES = [
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

export function ProfileSettingsPage() {
  const {
    profile,
    isLoading,
    updateProfile,
    isUpdating,
    uploadAvatar,
    isUploadingAvatar,
  } = useMyProfile();

  const fileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFeedback, setAvatarFeedback] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    timezone: "UTC",
    socialLinks: {
      linkedin: "",
      github: "",
      website: "",
      x: "",
    },
  });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      bio: profile.bio || "",
      timezone:
        profile.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC",
      socialLinks: {
        linkedin: profile.socialLinks?.linkedin || "",
        github: profile.socialLinks?.github || "",
        website: profile.socialLinks?.website || "",
        x: profile.socialLinks?.x || "",
      },
    });
  }, [profile]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFeedback(null);
    if (file.size > 5 * 1024 * 1024) {
      setAvatarFeedback({
        type: "error",
        message: "Avatar image must be smaller than 5 MB.",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      await uploadAvatar(file);
      setAvatarFeedback({
        type: "success",
        message: "Profile photo updated.",
      });
    } catch (err) {
      setAvatarPreview(null);
      setAvatarFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Failed to upload profile photo.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFieldChange = (field, value) => {
    setFeedback(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (key, value) => {
    setFeedback(null);
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!form.firstName.trim()) {
      setFeedback({ type: "error", message: "First name is required." });
      return;
    }

    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        bio: form.bio.trim(),
        timezone: form.timezone,
        socialLinks: {
          linkedin: form.socialLinks.linkedin.trim(),
          github: form.socialLinks.github.trim(),
          website: form.socialLinks.website.trim(),
          x: form.socialLinks.x.trim(),
        },
      });
      setFeedback({
        type: "success",
        message: "Your profile changes have been saved.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message || "Unable to update profile settings.",
      });
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-36 rounded-xl bg-muted/60 border border-border" />
        <div className="h-80 rounded-xl bg-muted/60 border border-border" />
      </div>
    );
  }

  const displayedAvatar = avatarPreview || profile?.avatar;
  const timezoneOptions = COMMON_TIMEZONES.includes(form.timezone)
    ? COMMON_TIMEZONES
    : [form.timezone, ...COMMON_TIMEZONES];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage how you appear across chats, meetings, docs, and project boards.
        </p>
      </div>

      {/* Avatar Section */}
      <SettingsSectionCard
        title="Profile photo"
        description="Shown beside your messages, tasks, and live video tiles. Supports JPG, PNG, WebP, or GIF up to 5 MB."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="size-16 ring-1 ring-border">
                {displayedAvatar && (
                  <AvatarImage
                    src={displayedAvatar}
                    alt={getUserName(profile)}
                  />
                )}
                <AvatarFallback
                  style={getAvatarStyle(profile)}
                  className="text-base font-bold font-heading"
                >
                  {getInitials(profile)}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground border-2 border-background flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                title="Change photo"
              >
                <Camera className="size-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {getUserName(profile)}
                </p>
                {profile?.role && (
                  <Badge variant="secondary" className="capitalize text-[11px]">
                    {profile.role}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {profile?.email}
              </p>
              {avatarFeedback && (
                <p
                  className={`text-xs flex items-center gap-1.5 pt-0.5 ${
                    avatarFeedback.type === "error"
                      ? "text-destructive"
                      : "text-status-live-foreground"
                  }`}
                >
                  {avatarFeedback.type === "error" ? (
                    <AlertCircle className="size-3.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-3.5 shrink-0" />
                  )}
                  <span>{avatarFeedback.message}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="size-3.5 mr-1.5" />
              {isUploadingAvatar ? "Uploading…" : "Upload new photo"}
            </Button>
          </div>
        </div>
      </SettingsSectionCard>

      {/* Personal Information & Social Links Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <SettingsSectionCard
          title="Personal information"
          description="Your name, bio, and local timezone used for scheduling and presence indicators."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  First name
                </label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    handleFieldChange("firstName", e.target.value)
                  }
                  placeholder="Alex"
                  maxLength={50}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Last name
                </label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    handleFieldChange("lastName", e.target.value)
                  }
                  placeholder="Morgan"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Work email
                </label>
                <Input
                  value={profile?.email || ""}
                  disabled
                  readOnly
                  className="font-mono text-xs opacity-75"
                />
                <p className="text-[11px] text-muted-foreground">
                  Managed by your workspace administrator.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Timezone
                </label>
                <Select
                  value={form.timezone}
                  onValueChange={(val) => handleFieldChange("timezone", val)}
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
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Bio
                </label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {form.bio.length}/500
                </span>
              </div>
              <Textarea
                rows={3}
                maxLength={500}
                placeholder="Product designer focused on design systems and real-time collaboration…"
                value={form.bio}
                onChange={(e) => handleFieldChange("bio", e.target.value)}
              />
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Directory & social links"
          description="Optional links displayed on your workspace member card."
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
                    Changes apply across your workspace immediately.
                  </span>
                )}
              </div>
              <Button type="submit" size="sm" disabled={isUpdating}>
                {isUpdating ? "Saving changes…" : "Save profile"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Briefcase className="size-3.5 text-muted-foreground" />
                LinkedIn URL
              </label>
              <Input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={form.socialLinks.linkedin}
                onChange={(e) => handleSocialChange("linkedin", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Code2 className="size-3.5 text-muted-foreground" />
                GitHub URL
              </label>
              <Input
                type="url"
                placeholder="https://github.com/username"
                value={form.socialLinks.github}
                onChange={(e) => handleSocialChange("github", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                Personal website
              </label>
              <Input
                type="url"
                placeholder="https://yourdomain.com"
                value={form.socialLinks.website}
                onChange={(e) => handleSocialChange("website", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Link2 className="size-3.5 text-muted-foreground" />
                X (Twitter) URL
              </label>
              <Input
                type="url"
                placeholder="https://x.com/username"
                value={form.socialLinks.x}
                onChange={(e) => handleSocialChange("x", e.target.value)}
              />
            </div>
          </div>
        </SettingsSectionCard>
      </form>
    </div>
  );
}

export default ProfileSettingsPage;

