import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Hash, ChevronLeft } from "lucide-react";

/**
 * Header for a Channel chat window.
 * @param {{ name, topic }} chat
 */
function ChannelHeader({ chat }) {
  const name = chat?.name ?? "channel";
  const topic = chat?.topic ?? "";

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-2">
        <Link 
          to="/chats/channel" 
          className="md:hidden p-1 mr-0.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <Hash className="size-4 text-muted-foreground shrink-0" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          {topic && (
            <p className="text-[11px] text-muted-foreground truncate max-w-[300px]">{topic}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default ChannelHeader;
