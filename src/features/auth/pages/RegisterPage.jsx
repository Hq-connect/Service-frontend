import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Mail,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import AuthFormField from "../components/AuthFormField";
import useTenant from "@/global/hooks/useTenant";

function RegisterPage({
  firstName = "",
  lastName = "",
  email = "",
  password = "",
  errors = {},
  isLoading = false,
  isSuccess = false,
  isInviteMode = false,
  invitation = null,
  isVerifyingInvite = false,
  inviteError = "",
  onFirstNameChange = () => {},
  onLastNameChange = () => {},
  onEmailChange = () => {},
  onPasswordChange = () => {},
  onSubmit = (e) => e.preventDefault(),
}) {
  const { tenant } = useTenant();
  const displayName =
    invitation?.workspaceName || tenant?.name || "your workspace";
  const tenantSlug = invitation?.workspaceSlug || tenant?.slug;

  if (isInviteMode && isVerifyingInvite) {
    return (
      <div className="w-full max-w-[400px] flex flex-col items-center gap-4 text-center py-8 animate-pulse">
        <div className="size-12 rounded-full bg-muted" />
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted/60" />
      </div>
    );
  }

  if (isInviteMode && inviteError) {
    return (
      <div className="w-full max-w-[400px] flex flex-col items-center gap-5 text-center">
        <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Invitation unavailable
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {inviteError}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link to="/auth/register">
            <Button variant="outline" size="sm">
              Request workspace access
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-[400px] flex flex-col items-center gap-6 text-center">
        <div className="size-14 rounded-full bg-muted flex items-center justify-center">
          <CheckCircle2 className="size-6 text-foreground" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Request submitted</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[320px]">
            Your access request has been sent to the{" "}
            <span className="font-medium text-foreground capitalize">
              {displayName}
            </span>{" "}
            administrator for review.
          </p>
        </div>

        <div className="w-full rounded-lg border bg-muted/30 divide-y text-left">
          {[
            { icon: Clock, text: "Admin reviews your request" },
            { icon: Mail, text: "You'll receive an approval email" },
            { icon: CheckCircle2, text: "Sign in with your new account" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Icon
                className="size-4 text-muted-foreground shrink-0"
                strokeWidth={1.5}
              />
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Already approved?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-7">
      <div className="space-y-2.5">
        {isInviteMode && invitation ? (
          <>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-status-live-border bg-status-live px-2.5 py-0.5 text-xs font-medium text-status-live-foreground">
              <Sparkles className="size-3" />
              Workspace invitation
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Join <span className="capitalize">{displayName}</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {invitation.inviterName ? (
                <>
                  <span className="font-medium text-foreground">
                    {invitation.inviterName}
                  </span>{" "}
                  invited you to join as a{" "}
                </>
              ) : (
                "You have been invited to join as a "
              )}
              <Badge variant="secondary" className="capitalize text-xs">
                {invitation.role || "member"}
              </Badge>
              . Complete your profile below to get started immediately.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold tracking-tight">Request access</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Submit your details to join{" "}
              <span className="font-medium text-foreground capitalize">
                {displayName}
              </span>
              . Your request will be reviewed by the workspace admin.
            </p>
          </>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs text-muted-foreground">Workspace</span>
          <Badge variant="secondary" className="font-mono text-xs">
            {tenantSlug}
          </Badge>
          {displayName && displayName !== tenantSlug && (
            <span className="text-xs text-muted-foreground">
              · {displayName}
            </span>
          )}
        </div>
      </div>

      <form
        id="register-form"
        onSubmit={onSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <AuthFormField
            id="register-firstName"
            label="First name"
            type="text"
            placeholder="Alex"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            error={errors.firstName}
          />
          <AuthFormField
            id="register-lastName"
            label="Last name"
            type="text"
            placeholder="Smith"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            error={errors.lastName}
            hint="Optional"
          />
        </div>

        <AuthFormField
          id="register-email"
          label="Work email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          disabled={isInviteMode}
          readOnly={isInviteMode}
          onChange={(e) => onEmailChange(e.target.value)}
          error={errors.email}
          hint={
            isInviteMode
              ? "Locked to the email address this invitation was sent to"
              : undefined
          }
        />

        <AuthFormField
          id="register-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          error={errors.password}
          hint="8–128 characters"
        />

        <Button
          id="register-submit-btn"
          type="submit"
          size="lg"
          className="w-full mt-1"
          disabled={isLoading}
        >
          {isLoading
            ? isInviteMode
              ? "Joining workspace…"
              : "Submitting…"
            : isInviteMode
              ? "Accept invitation & join"
              : "Request access"}
        </Button>

        {errors.general && (
          <p role="alert" className="text-xs text-destructive text-center">
            {errors.general}
          </p>
        )}
      </form>

      <Separator />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/auth/login"
          className="font-medium text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
