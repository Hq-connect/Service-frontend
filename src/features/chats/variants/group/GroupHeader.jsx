import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, MoreHorizontal, ChevronLeft } from "lucide-react";
import GroupDetailsDialog from "./GroupDetailsDialog";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { getUserInitials, getAvatarStyle, getUserDisplayName } from "@/global/utils/user";

/**
 * Header for a Group chat window.
 * @param {{ name, members, _id, chatId, avatar }} chat
 */
function GroupHeader({ chat }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const chatId = chat?._id || chat?.chatId;

  const { data: members = [] } = useGroupMembers(chatId);

  const name = chat?.name ?? "Group";
  const memberList = members.length > 0 ? members : (chat?.members ?? []);
  const memberCount = memberList.length;

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
          
          {/* Stacked member avatars or group initials fallback */}
          <div className="relative shrink-0">
            {memberList.length > 0 ? (
              <div className="flex items-center">
                {memberList.slice(0, 3).map((member, idx) => {
                  const displayName = getUserDisplayName(member);
                  const avatarUrl = member.userSnapshot?.avatar || member.avatar;
                  const initials = getUserInitials(member);
                  const avatarStyle = getAvatarStyle(member);

                  return (
                    <Avatar
                      key={member.userId || member._id || idx}
                      className="size-7 border-2 border-background"
                      style={{
                        marginLeft: idx === 0 ? 0 : "-8px",
                        zIndex: 3 - idx,
                      }}
                    >
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                      <AvatarFallback
                        style={avatarStyle}
                        className="text-[9px] font-semibold"
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
              </div>
            ) : (
              <Avatar className="size-8">
                {chat?.avatar && <AvatarImage src={chat.avatar} alt={name} />}
                <AvatarFallback
                  style={getAvatarStyle(chatId || name)}
                  className="text-xs font-semibold"
                >
                  {getUserInitials(name)}
                </AvatarFallback>
              </Avatar>
            )}
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
