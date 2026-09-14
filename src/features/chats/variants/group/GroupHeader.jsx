import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Info, MoreHorizontal, Users, ChevronLeft } from "lucide-react";
import GroupDetailsDialog from "./GroupDetailsDialog";
import { useGroupMembers } from "../../hooks/useGroupMembers";

/**
 * Header for a Group chat window.
 * @param {{ name, members, _id, chatId }} chat
 */
function GroupHeader({ chat }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const chatId = chat?._id || chat?.chatId;

  const { data: members = [] } = useGroupMembers(chatId);

  const name = chat?.name ?? "Group";
  const memberCount = members.length > 0 ? members.length : (chat?.members?.length ?? 0);

  return (
    <>
      <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-background shrink-0">
        <div 
          onClick={() => setDetailsOpen(true)}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Link 
            to="/chats/group" 
            onClick={(e) => e.stopPropagation()}
            className="md:hidden p-1 mr-0.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary">
            <Users className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-[11px] text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDetailsOpen(true)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Info className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDetailsOpen(true)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      <GroupDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        chat={chat}
      />
    </>
  );
}

export default GroupHeader;
