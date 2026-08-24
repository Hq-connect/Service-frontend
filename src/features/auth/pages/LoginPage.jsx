import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import AuthFormField from "../components/AuthFormField"
import AuthDivider from "../components/AuthDivider"
import useTenant from "@/global/hooks/useTenant"

// Dumb component — handlers are no-ops until the logic layer is added
function LoginPage({
  email = "",
  password = "",
  errors = {},
  isLoading = false,
  onEmailChange = () => {},
  onPasswordChange = () => {},
  onSubmit = (e) => e.preventDefault(),
}) {
  const { tenant } = useTenant();
  const displayName = tenant?.name || "your workspace";

  return (
    <div className="w-full max-w-[400px] flex flex-col gap-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to <span className="font-medium text-foreground capitalize">{displayName}</span> to continue.
        </p>
      </div>


      <form id="login-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <AuthFormField
          id="login-email"
          label="Work email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          error={errors.email}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium leading-none">Password</span>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <AuthFormField
            id="login-password"
            label=""
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            error={errors.password}
            className="gap-0"
          />
        </div>

        <Button id="login-submit-btn" type="submit" size="lg" className="w-full mt-1" disabled={isLoading}>
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <Separator />
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/auth/register"
          className="font-medium text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Request access
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
