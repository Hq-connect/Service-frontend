import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

/**
 * List item for a Group chat conversation.
 * @param {{ _id, name, members, lastMessage, unreadCount, updatedAt }} chat
 */
function GroupListItem({ chat }) {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const isActive = chatId === chat._id;

  const name = chat.name ?? "Unnamed Group";
  const members = chat.members ?? [];
  const lastText = chat.lastMessage?.content?.text ?? "";
  const unread = chat.unreadCount ?? 0;
  const timeLabel = chat.updatedAt
    ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  // Show up to 3 stacked mini avatars
  const visibleMembers = members.slice(0, 3);

  return (
    <button
      onClick={() => navigate(`/chats/group/${chat._id}`)}
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
              const fn = member.firstName ?? "";
              const ln = member.lastName ?? "";
              const initials = `${fn[0] ?? ""}${ln[0] ?? ""}`.toUpperCase() || "U";
              const email = member.email ?? `m${idx}@hq`;
              let hash = 0;
              for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
              const h = Math.abs(hash % 360);
              return (
                <Avatar
                  key={member._id ?? idx}
                  className="size-6 border-2 border-background"
                  style={{ marginLeft: idx === 0 ? 0 : "-8px", zIndex: visibleMembers.length - idx }}
                >
                  <AvatarFallback
                    style={{ backgroundColor: `hsl(${h},55%,88%)`, color: `hsl(${h},60%,30%)` }}
                    className="text-[8px] font-semibold"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        ) : (
          <div className="size-9 rounded-full bg-muted flex items-center justify-center">
            <Users className="size-4 text-muted-foreground" />
          </div>
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

export default GroupListItem;
