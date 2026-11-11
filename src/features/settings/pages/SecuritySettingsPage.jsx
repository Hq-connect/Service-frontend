import { useState } from "react";
import {
  KeyRound,
  Laptop,
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SettingsSectionCard from "../components/SettingsSectionCard";
import useMySecurity from "../hooks/useMySecurity";

function parseDeviceLabel(userAgent = "") {
  if (!userAgent) return { label: "Web Browser", isMobile: false };
  const ua = userAgent.toLowerCase();
  const isMobile = /iphone|ipad|android|mobile/.test(ua);

  let browser = "Browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome/"))
    browser = "Safari";

  let os = "Device";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";

  return { label: `${browser} on ${os}`, isMobile };
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function SecuritySettingsPage() {
  const {
    sessions,
    isLoadingSessions,
    changePassword,
    isChangingPassword,
    revokeSession,
    isRevokingSession,
    revokeAllOtherSessions,
    isRevokingAllOthers,
  } = useMySecurity();

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState(null);
  const [sessionFeedback, setSessionFeedback] = useState(null);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (!passwords.currentPassword || !passwords.newPassword) {
      setPwdFeedback({
        type: "error",
        message: "Enter both your current password and a new password.",
      });
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPwdFeedback({
        type: "error",
        message: "New password must be at least 8 characters long.",
      });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwdFeedback({
        type: "error",
        message: "New password and confirmation do not match.",
      });
      return;
    }

    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPwdFeedback({
        type: "success",
        message:
          "Password updated. All other active sessions have been signed out.",
      });
    } catch (err) {
      setPwdFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Failed to change password. Check your current password.",
      });
    }
  };

  const handleRevokeOne = async (sessionId) => {
    setSessionFeedback(null);
    try {
      await revokeSession(sessionId);
      setSessionFeedback({
        type: "success",
        message: "Session revoked.",
      });
    } catch (err) {
      setSessionFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to revoke session.",
      });
    }
  };

  const handleRevokeAllOthers = async () => {
    setSessionFeedback(null);
    try {
      const res = await revokeAllOtherSessions();
      const count =
        res?.removedCount ?? res?.data?.removedCount ?? res?.data?.revokedCount ?? 0;
      setSessionFeedback({
        type: "success",
        message: `Signed out ${count} other ${count === 1 ? "session" : "sessions"}.`,
      });
    } catch (err) {
      setSessionFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Failed to sign out other active sessions.",
      });
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Security & sessions
        </h1>
        <p className="text-xs text-muted-foreground">
          Update your password and manage devices currently signed in to your account.
        </p>
      </div>

      {/* Password Update Form */}
      <form onSubmit={handlePasswordSubmit}>
        <SettingsSectionCard
          title="Change password"
          description="Updating your password immediately revokes all other active device sessions."
          headerAction={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowPasswords((v) => !v)}
              className="gap-1.5 text-muted-foreground"
            >
              {showPasswords ? (
                <>
                  <EyeOff className="size-3.5" /> Hide
                </>
              ) : (
                <>
                  <Eye className="size-3.5" /> Show
                </>
              )}
            </Button>
          }
          footer={
            <>
              <div className="text-xs">
                {pwdFeedback ? (
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium ${
                      pwdFeedback.type === "error"
                        ? "text-destructive"
                        : "text-status-live-foreground"
                    }`}
                  >
                    {pwdFeedback.type === "error" ? (
                      <AlertCircle className="size-3.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="size-3.5 shrink-0" />
                    )}
                    {pwdFeedback.message}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Use 8–128 characters with a mix of letters, numbers, and symbols.
                  </span>
                )}
              </div>
              <Button type="submit" size="sm" disabled={isChangingPassword}>
                <KeyRound className="size-3.5 mr-1.5" />
                {isChangingPassword ? "Updating…" : "Update password"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Current password
              </label>
              <Input
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={passwords.currentPassword}
                onChange={(e) => {
                  setPwdFeedback(null);
                  setPasswords((p) => ({
                    ...p,
                    currentPassword: e.target.value,
                  }));
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                New password
              </label>
              <Input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={passwords.newPassword}
                onChange={(e) => {
                  setPwdFeedback(null);
                  setPasswords((p) => ({ ...p, newPassword: e.target.value }));
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Confirm new password
              </label>
              <Input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={passwords.confirmPassword}
                onChange={(e) => {
                  setPwdFeedback(null);
                  setPasswords((p) => ({
                    ...p,
                    confirmPassword: e.target.value,
                  }));
                }}
              />
            </div>
          </div>
        </SettingsSectionCard>
      </form>

      {/* Active Sessions */}
      <SettingsSectionCard
        title="Active sessions"
        description="Devices currently authenticated with your workspace account."
        headerAction={
          otherSessionsCount > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="xs"
              disabled={isRevokingAllOthers}
              onClick={handleRevokeAllOthers}
            >
              <LogOut className="size-3.5 mr-1" />
              {isRevokingAllOthers
                ? "Signing out…"
                : `Sign out ${otherSessionsCount} other ${
                    otherSessionsCount === 1 ? "session" : "sessions"
                  }`}
            </Button>
          )
        }
      >
        {sessionFeedback && (
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
              sessionFeedback.type === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-status-live-border bg-status-live/50 text-status-live-foreground"
            }`}
          >
            {sessionFeedback.type === "error" ? (
              <ShieldAlert className="size-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="size-3.5 shrink-0" />
            )}
            <span>{sessionFeedback.message}</span>
          </div>
        )}

        {isLoadingSessions ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted/60" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No active sessions found.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {sessions.map((session) => {
              const { label, isMobile } = parseDeviceLabel(session.userAgent);
              const DeviceIcon = isMobile ? Smartphone : Laptop;

              return (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <DeviceIcon className="size-4 text-foreground" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {label}
                        </span>
                        {session.isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-status-live-border bg-status-live px-2 py-0.5 text-[10px] font-medium text-status-live-foreground">
                            <span className="size-1.5 rounded-full bg-status-live-foreground" />
                            Current session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        IP:{" "}
                        <span className="font-mono">
                          {session.ip || "Unknown"}
                        </span>{" "}
                        · Signed in {formatDateTime(session.createdAt)}
                      </p>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      disabled={isRevokingSession}
                      onClick={() => handleRevokeOne(session.id)}
                      className="self-end sm:self-center shrink-0"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SettingsSectionCard>
    </div>
  );
}

export default SecuritySettingsPage;

