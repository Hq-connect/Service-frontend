import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Users, ChevronLeft } from "lucide-react";

/**
 * Header for a Group chat window.
 * @param {{ name, members }} chat
 */
function GroupHeader({ chat }) {
  const name = chat?.name ?? "Group";
  const memberCount = chat?.members?.length ?? 0;

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
      <div className="flex items-center gap-3">
        <Link 
          to="/chats/group" 
          className="md:hidden p-1 mr-0.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="flex items-center justify-center size-8 rounded-full bg-muted">
          <Users className="size-4 text-muted-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </p>
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

export default GroupHeader;
