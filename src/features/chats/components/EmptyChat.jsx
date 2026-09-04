import React from "react";
import { MessageSquareDashed } from "lucide-react";

/**
 * Shown when no chat is selected.
 */
function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none px-8">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-muted">
        <MessageSquareDashed className="size-8 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No conversation selected</p>
        <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
          Pick a DM, group, or channel from the sidebar to start messaging.
        </p>
      </div>
    </div>
  );
}

export default EmptyChat;
