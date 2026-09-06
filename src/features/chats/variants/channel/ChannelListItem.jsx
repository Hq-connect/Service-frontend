import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Hash } from "lucide-react";
import { getLastMessageInfo } from "../../utils/fileTypeConfig";

/**
 * List item for a Channel conversation.
 * @param {{ _id, name, topic, lastMessage, unreadCount, updatedAt }} chat
 */
function ChannelListItem({ chat }) {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const isActive = chatId === chat._id;

  const name = chat.name ?? "channel";
  const lastInfo = getLastMessageInfo(chat.lastMessage);
  const LastIcon = lastInfo.icon;
  const unread = chat.unreadCount ?? 0;
  const timeLabel = chat.updatedAt
    ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <button
      onClick={() => navigate(`/chats/channel/${chat._id}`)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-100 text-left group",
        isActive
          ? "bg-accent text-foreground"
          : "hover:bg-accent/50 text-foreground/80 hover:text-foreground"
      )}
    >
      {/* Hash icon */}
      <div className="flex items-center justify-center size-9 rounded-full bg-muted shrink-0">
        <Hash className="size-4 text-muted-foreground" />
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

export default ChannelListItem;
