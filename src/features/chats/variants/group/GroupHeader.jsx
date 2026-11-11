import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, MoreHorizontal, ChevronLeft, Phone, Video, Loader2 } from "lucide-react";
import GroupDetailsDialog from "./GroupDetailsDialog";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { getUserInitials, getAvatarStyle, getUserDisplayName } from "@/global/utils/user";
import useInitiateCall from "../../hooks/useInitiateCall";

/**
 * Header for a Group chat window.
 * @param {{ name, members, _id, chatId, avatar }} chat
 */
function GroupHeader({ chat }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const chatId = chat?._id || chat?.chatId;

  const { data: members = [] } = useGroupMembers(chatId);
  const { initiateCall, isStartingCall } = useInitiateCall({
    chat: {
      ...chat,
      members: members.length > 0 ? members : chat?.members,
    },
    chatType: "group",
  });

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

          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground tracking-tight">{name}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-medium bg-muted/60 text-muted-foreground border border-border">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border bg-muted/30 mr-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => initiateCall({ callType: "audio" })}
              disabled={isStartingCall}
              title={`Start group audio call in ${name}`}
              className="size-7 text-muted-foreground hover:text-foreground hover:bg-background active:scale-95 transition-all duration-150 cursor-pointer"
            >
              {isStartingCall ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <Phone className="size-3.5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => initiateCall({ callType: "video" })}
              disabled={isStartingCall}
              title={`Start group video call in ${name}`}
              className="size-7 text-muted-foreground hover:text-foreground hover:bg-background active:scale-95 transition-all duration-150 cursor-pointer"
            >
              {isStartingCall ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <Video className="size-3.5" />
              )}
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDetailsOpen(true)}
            title="Group Info"
            className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
          >
            <Info className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDetailsOpen(true)}
            className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 cursor-pointer"
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
