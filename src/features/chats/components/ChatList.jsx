import React from "react";
import ChatListItem from "./ChatListItem";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a list of chat conversations.
 * @param {"dm"|"group"|"channel"} type
 * @param {object[]} chats
 * @param {boolean} isLoading
 */
function ChatList({ type, chats = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 px-2 py-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2.5 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          {type === "dm" ? "No direct messages yet." :
           type === "group" ? "No group chats yet." :
           "No channels yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 px-2 py-1">
      {chats.map((chat, idx) => {
        const itemKey = chat.chatId || chat._id || chat.id || chat.otherUser?.userId || idx;
        return <ChatListItem key={itemKey} type={type} chat={chat} />;
      })}
    </div>
  );
}

export default ChatList;
