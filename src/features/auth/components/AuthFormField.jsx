import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Reusable form field: Label → Input → optional helper/error text.
 *
 * Props:
 *  id, label, error, hint — standard form field anatomy
 *  All other props forwarded to <Input />.
 */
function AuthFormField({ id, label, error, hint, className, ...inputProps }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive leading-snug">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground leading-snug">
          {hint}
        </p>
      )}
    </div>
  )
}

export default AuthFormField
