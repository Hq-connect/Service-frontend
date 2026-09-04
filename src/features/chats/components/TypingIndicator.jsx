import React from "react";
import { cn } from "@/lib/utils";

/**
 * Animated "... is typing" indicator row.
 * @param {string[]} userNames - Names of users currently typing
 */
function TypingIndicator({ userNames = [] }) {
  if (!userNames.length) return null;

  const label =
    userNames.length === 1
      ? `${userNames[0]} is typing`
      : userNames.length === 2
      ? `${userNames[0]} and ${userNames[1]} are typing`
      : "Several people are typing";

  return (
    <div className="flex items-center gap-2 px-4 py-1 select-none">
      {/* Animated dots */}
      <div className="flex items-end gap-[3px] h-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "size-[5px] rounded-full bg-muted-foreground/60 animate-bounce",
            )}
            style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground italic">{label}</span>
    </div>
  );
}

export default TypingIndicator;
