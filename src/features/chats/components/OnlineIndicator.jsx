import React from "react";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  busy: "bg-rose-500",
  offline: "bg-muted-foreground/40",
};

/**
 * A small presence dot indicator.
 * @param {"online"|"away"|"busy"|"offline"} status
 * @param {"xs"|"sm"|"md"} size
 * @param {string} className
 */
function OnlineIndicator({ status = "offline", size = "sm", className }) {
  const sizeClasses = {
    xs: "size-1.5",
    sm: "size-2.5",
    md: "size-3",
  };

  return (
    <span
      className={cn(
        "rounded-full ring-2 ring-background shrink-0 block",
        STATUS_STYLES[status] ?? STATUS_STYLES.offline,
        sizeClasses[size],
        className
      )}
      aria-label={`Status: ${status}`}
    />
  );
}

export default OnlineIndicator;
