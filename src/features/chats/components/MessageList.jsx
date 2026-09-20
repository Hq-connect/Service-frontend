import React, { useState } from "react";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import MessageItem from "./MessageItem";
import TypingIndicator from "./TypingIndicator";
import { useMessages } from "../hooks/useMessages";

/**
 * The scrollable message list area.
 * Uses shadcn MessageScroller for proper chat scroll behavior.
 *
 * @param {string} chatId
 * @param {"dm"|"group"|"channel"} chatType
 * @param {string} currentUserId
 * @param {string[]} typingUsers - Names of users currently typing
 * @param {Function} onReply
 * @param {Function} onEdit
 * @param {Function} onDelete
 * @param {Function} onReact
 */
function MessageList({
  chatId,
  chatType = "dm",
  currentUserId,
  otherUser,
  groupMembers = [],
  typingUsers = [],
  onReply,
  onEdit,
  onDelete,
  onReact,
}) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(chatType, chatId);

  // Flatten infinite query pages (messages come oldest-first after reversal)
  const allMessages = React.useMemo(() => {
    if (!data?.pages) return [];
    // Pages are in reverse-chronological order; reverse each page and the pages array
    return [...data.pages].reverse().flatMap((page) => [...(page ?? [])].reverse());
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 3 === 2 ? "flex-row-reverse" : ""}`}>
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 max-w-[60%]">
              <Skeleton className="h-3 w-24" />
              <Skeleton className={`h-10 rounded-xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="py-4 gap-0 justify-end">
            {/* Load earlier button */}
            {hasNextPage && (
              <MessageScrollerItem messageId="load-more">
                <div className="flex justify-center py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="text-xs text-muted-foreground"
                  >
                    {isFetchingNextPage ? (
                      <><Loader2 className="size-3 animate-spin mr-1" /> Loading...</>
                    ) : (
                      "Load earlier messages"
                    )}
                  </Button>
                </div>
              </MessageScrollerItem>
            )}

            {allMessages.length === 0 && (
              <MessageScrollerItem messageId="empty">
                <div className="flex justify-center py-8">
                  <p className="text-xs text-muted-foreground">No messages yet. Say hello!</p>
                </div>
              </MessageScrollerItem>
            )}

            {allMessages.map((message, idx) => {
              const prevMessage = allMessages[idx - 1];
              const isSameSender = prevMessage?.senderId === message.senderId ||
                prevMessage?.senderId?._id === message.senderId?._id;

              // Resolve sender info from populated senderId or fallback
              let senderInfo = {};
              if (typeof message.senderId === "object" && message.senderId !== null) {
                senderInfo = message.senderId;
              } else if (otherUser && (message.senderId === otherUser.userId || message.senderId === otherUser.id)) {
                senderInfo = otherUser;
              } else if (chatType === "group" && groupMembers.length > 0) {
                const found = groupMembers.find(
                  (m) =>
                    m.userId === message.senderId ||
                    m._id === message.senderId ||
                    m.id === message.senderId ||
                    m.userSnapshot?._id === message.senderId
                );
                if (found) {
                  senderInfo = {
                    name: found.userSnapshot?.name || found.name || found.email,
                    avatar: found.userSnapshot?.avatar || found.avatar,
                    userId: found.userId || found._id,
                    userSnapshot: found.userSnapshot,
                    ...found,
                  };
                }
              }

              return (
                <MessageScrollerItem
                  key={message._id || message.messageId || message.id || i}
                  messageId={message._id || message.messageId || message.id}
                  scrollAnchor={false}
                >
                  <MessageItem
                    message={message}
                    currentUserId={currentUserId}
                    senderInfo={senderInfo}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReact={onReact}
                  />
                </MessageScrollerItem>
              );
            })}

            {/* Typing indicator as a scroller row */}
            {typingUsers.length > 0 && (
              <MessageScrollerItem messageId="typing-indicator">
                <TypingIndicator userNames={typingUsers} />
              </MessageScrollerItem>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        {/* Jump-to-latest button */}
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

export default MessageList;
