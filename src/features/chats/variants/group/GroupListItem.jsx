import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { getLastMessageInfo } from "../../utils/fileTypeConfig";
import { getUserInitials, getAvatarStyle, getUserDisplayName } from "@/global/utils/user";

/**
 * List item for a Group chat conversation.
 * @param {{ _id, name, members, lastMessage, unreadCount, updatedAt }} chat
 */
function GroupListItem({ chat }) {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const targetId = chat._id || chat.chatId;
  const isActive = chatId === targetId;

  const name = chat.name ?? "Unnamed Group";
  const members = chat.members ?? [];
  const lastInfo = getLastMessageInfo(chat.lastMessage);
  const LastIcon = lastInfo.icon;
  const unread = chat.unreadCount ?? 0;
  const timeLabel = chat.updatedAt
    ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  // Show up to 3 stacked mini avatars
  const visibleMembers = members.slice(0, 3);

  return (
    <button
      onClick={() => navigate(`/chats/group/${targetId}`)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-100 text-left group",
        isActive
          ? "bg-accent text-foreground"
          : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
      )}
    >
      {/* Stacked mini avatars */}
      <div className="relative size-9 shrink-0">
        {visibleMembers.length > 0 ? (
          <div className="flex">
            {visibleMembers.map((member, idx) => {
              const displayName = getUserDisplayName(member);
              const avatarUrl = member.userSnapshot?.avatar || member.avatar;
              const initials = getUserInitials(member);
              const avatarStyle = getAvatarStyle(member);

              return (
                <Avatar
                  key={member.userId ?? member._id ?? idx}
                  className="size-6 border-2 border-background"
                  style={{ marginLeft: idx === 0 ? 0 : "-8px", zIndex: visibleMembers.length - idx }}
                >
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback
                    style={avatarStyle}
                    className="text-[8px] font-semibold"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        ) : (
          <Avatar className="size-9">
            {chat.avatar && <AvatarImage src={chat.avatar} alt={name} />}
            <AvatarFallback
              style={getAvatarStyle(targetId || name)}
              className="text-xs font-semibold"
            >
              {getUserInitials(name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Name + last message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm truncate", unread > 0 ? "font-semibold" : "font-medium")}>
            {name}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground truncate max-w-[160px]">
            {LastIcon && <LastIcon className={cn("size-3.5 shrink-0", lastInfo.iconColor)} />}
            <span className="truncate">{lastInfo.text}</span>
          </div>
          {unread > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default GroupListItem;
