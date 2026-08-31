import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import OnlineIndicator from "../../components/OnlineIndicator";

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

  const displayName = chat.otherUser?.name || "Unknown";
  const initials = displayName
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const lastText = chat.lastMessage?.content?.text ?? "";
  const unread = chat.unreadCount ?? 0;

  const timeLabel = chat.updatedAt
    ? new Date(chat.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Deterministic avatar color from userId
  const seed = chat.otherUser?.userId ?? chat.otherUser?.name ?? "u";
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  const avatarStyle = {
    backgroundColor: `hsl(${h},55%,88%)`,
    color: `hsl(${h},60%,30%)`,
  };

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
          <OnlineIndicator status={chat.otherUser?.presence ?? "offline"} size="xs" />
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
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
            {lastText || "No messages yet"}
          </p>
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
