import { cn } from "@/lib/utils";

/**
 * Architectural section card for Settings pages.
 * Follows HQ Brand Guidelines: 1px hairline border, subtle card shadow,
 * optional muted footer bar for primary/secondary actions.
 */
export function SettingsSectionCard({
  title,
  description,
  badge,
  headerAction,
  footer,
  danger = false,
  className,
  contentClassName,
  children,
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-(--shadow-card) overflow-hidden transition-colors",
        danger ? "border-destructive/40" : "border-border",
        className
      )}
    >
      {(title || description || headerAction || badge) && (
        <div
          className={cn(
            "flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between px-5 py-4 border-b",
            danger ? "border-destructive/20 bg-destructive/5" : "border-border"
          )}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {title && (
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              )}
              {badge}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0 flex items-center gap-2 pt-1 sm:pt-0">
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className={cn("p-5", contentClassName)}>{children}</div>

      {footer && (
        <div
          className={cn(
            "px-5 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
            danger
              ? "border-destructive/20 bg-destructive/5"
              : "border-border bg-muted/40"
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}

export default SettingsSectionCard;

