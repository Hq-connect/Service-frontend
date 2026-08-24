import { cn } from "@/lib/utils"

/**
 * Global full-screen loader overlay.
 *
 * Props:
 *  - visible   {boolean}  – controls mount/display (default true)
 *  - message   {string}   – optional label below the animation
 *  - className {string}   – extra classes on the root overlay
 */
function Loader({ visible = true, message = "Loading…", className }) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-5",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      {/* ── Equalizer 3-bar animation ── */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 60 50"
        aria-hidden="true"
        className="size-14"
      >
        <g transform="translate(6, 5)">
          {/* Bar 1 – muted */}
          <rect x="0" y="10" width="12" height="30" rx="6" fill="currentColor" className="text-muted-foreground/40">
            <animate attributeName="height" values="30;16;38;22;30" dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" />
            <animate attributeName="y"      values="10;24;2;18;10"   dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" />
          </rect>

          {/* Bar 2 – primary (tallest, fastest) */}
          <rect x="18" y="0" width="12" height="40" rx="6" fill="currentColor" className="text-primary">
            <animate attributeName="height" values="40;20;44;28;40" dur="2.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" />
            <animate attributeName="y"      values="0;20;-4;12;0"   dur="2.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" />
          </rect>

          {/* Bar 3 – muted-foreground mid */}
          <rect x="36" y="15" width="12" height="25" rx="6" fill="currentColor" className="text-muted-foreground/70">
            <animate attributeName="height" values="25;38;14;32;25" dur="3.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" />
            <animate attributeName="y"      values="15;2;26;8;15"   dur="3.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" />
          </rect>
        </g>
      </svg>

      {/* ── Label ── */}
      {message && (
        <p className="text-sm font-medium text-muted-foreground tracking-wide select-none">
          {message}
        </p>
      )}
    </div>
  )
}

export default Loader