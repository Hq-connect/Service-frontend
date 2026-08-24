import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

/**
 * Decorative "── or ──" divider used between SSO and credential forms.
 */
function AuthDivider({ label = "or continue with email", className }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}

export default AuthDivider
