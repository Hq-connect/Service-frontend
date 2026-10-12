import React from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import OnlineIndicator from "../../components/OnlineIndicator";
import { getLastMessageInfo } from "../../utils/fileTypeConfig";
import { getUserInitials, getAvatarStyle } from "@/global/utils/user";

/**
 * List item for a Direct Message conversation.
 *
 * API data shape (getDms):
 * {
 *   chatId: string,
 *   otherUser: { userId, name, avatar },
 *   lastMessage: { _id, senderId, content: { text, attachments }, createdAt },
 *   updatedAt: string
 * }
 */
function DMListItem({ chat }) {
  const navigate = useNavigate();
  const { chatId: activeChatId } = useParams();
  const isActive = activeChatId === chat.chatId;

  const onlineUsers = useSelector((state) => state.chat.onlineUsers);
  const rawTargetUserId = chat.otherUser?.userId || chat.otherUser?._id || chat.otherUser?.id;
  const targetUserId = rawTargetUserId ? String(rawTargetUserId) : null;
  const isOnline = targetUserId ? onlineUsers[targetUserId] : undefined;
  const presence =
    isOnline === true ? "online" : isOnline === false ? "offline" : (chat.otherUser?.presence ?? "offline");

  const displayName = chat.otherUser?.name || "Unknown";
  const initials = getUserInitials(chat.otherUser);
  const avatarStyle = getAvatarStyle(chat.otherUser);

  const lastInfo = getLastMessageInfo(chat.lastMessage);
  const LastIcon = lastInfo.icon;
  const unread = chat.unreadCount ?? 0;

  const timeLabel = chat.updatedAt
    ? new Date(chat.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <button
      onClick={() => navigate(`/chats/dm/${chat.chatId}`)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-100 text-left group",
        isActive
          ? "bg-accent text-foreground"
          : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
      )}
    >
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        <Avatar className="size-9">
          {chat.otherUser?.avatar && (
            <AvatarImage src={chat.otherUser.avatar} alt={displayName} />
          )}
          <AvatarFallback style={avatarStyle} className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineIndicator status={presence} size="xs" />
        </div>
      </div>

      {/* Name + last message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              unread > 0 ? "font-semibold" : "font-medium"
            )}
          >
            {displayName}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {timeLabel}
          </span>
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

export default DMListItem;
