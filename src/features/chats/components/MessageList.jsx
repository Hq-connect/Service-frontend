import React, { useState } from "react";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
} from "@/components/ui/message-scroller";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import MessageItem from "./MessageItem";
import TypingIndicator from "./TypingIndicator";
import { useMessages } from "../hooks/useMessages";

/**
 * Controller component nested inside MessageScrollerProvider.
 * Uses shadcn's official useMessageScroller hook to scroll the viewport
 * cleanly to the exact bottom without over-scrolling or window jumping.
 */
function MessageScrollerAutoScroll({ allMessagesLength, chatId }) {
  const { scrollToEnd } = useMessageScroller();
  const prevChatId = React.useRef(chatId);
  const prevCount = React.useRef(allMessagesLength);

  React.useEffect(() => {
    if (prevChatId.current !== chatId) {
      prevChatId.current = chatId;
      prevCount.current = allMessagesLength;
      requestAnimationFrame(() => {
        scrollToEnd({ behavior: "auto" });
      });
    } else if (allMessagesLength > prevCount.current) {
      prevCount.current = allMessagesLength;
      requestAnimationFrame(() => {
        scrollToEnd({ behavior: "smooth" });
      });
    }
  }, [allMessagesLength, chatId, scrollToEnd]);

  return null;
}

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
      <MessageScrollerAutoScroll allMessagesLength={allMessages.length} chatId={chatId} />
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="py-4 gap-0">
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
              const nextMessage = allMessages[idx + 1];

              const currentMsgDate = message.createdAt ? new Date(message.createdAt) : null;
              const prevMsgDate = prevMessage?.createdAt ? new Date(prevMessage.createdAt) : null;
              const nextMsgDate = nextMessage?.createdAt ? new Date(nextMessage.createdAt) : null;

              // Check if calendar day changed
              const isFirstOfDay = !prevMsgDate || (currentMsgDate && currentMsgDate.toDateString() !== prevMsgDate.toDateString());

              const senderIdStr = String(message.senderId?._id || message.senderId?.userId || message.senderId || "");
              const prevSenderIdStr = String(prevMessage?.senderId?._id || prevMessage?.senderId?.userId || prevMessage?.senderId || "");
              const nextSenderIdStr = String(nextMessage?.senderId?._id || nextMessage?.senderId?.userId || nextMessage?.senderId || "");

              // Clustering conditions (same sender, within 5 mins, same day, not reply or deleted)
              const timeDiffFromPrev = (currentMsgDate && prevMsgDate) ? Math.abs(currentMsgDate - prevMsgDate) : Infinity;
              const isClusterPrev = !isFirstOfDay && !message.deletedAt && !prevMessage?.deletedAt && !message.replyTo && (senderIdStr === prevSenderIdStr) && timeDiffFromPrev < 5 * 60 * 1000;

              const isSameDayNext = nextMsgDate && currentMsgDate && currentMsgDate.toDateString() === nextMsgDate.toDateString();
              const timeDiffToNext = (currentMsgDate && nextMsgDate) ? Math.abs(nextMsgDate - currentMsgDate) : Infinity;
              const isClusterNext = isSameDayNext && !message.deletedAt && !nextMessage?.deletedAt && !nextMessage?.replyTo && (senderIdStr === nextSenderIdStr) && timeDiffToNext < 5 * 60 * 1000;

              let clusterPosition = "single";
              if (!isClusterPrev && isClusterNext) clusterPosition = "start";
              else if (isClusterPrev && isClusterNext) clusterPosition = "middle";
              else if (isClusterPrev && !isClusterNext) clusterPosition = "end";

              // Resolve sender info from populated senderId or fallback
              let senderInfo = {};

              if (typeof message.senderId === "object" && message.senderId !== null && (message.senderId.name || message.senderId.firstName)) {
                senderInfo = message.senderId;
              } else if (otherUser && (senderIdStr === String(otherUser.userId || "") || senderIdStr === String(otherUser.id || "") || senderIdStr === String(otherUser._id || ""))) {
                senderInfo = otherUser;
              } else if (chatType === "group" && groupMembers.length > 0) {
                const found = groupMembers.find((m) => {
                  const mUserIdStr = String(
                    (typeof m.userId === "object" && m.userId !== null)
                      ? (m.userId._id || m.userId.id || "")
                      : (m.userId || "")
                  );
                  const mIdStr = String(m._id || m.id || "");
                  const mSnapshotIdStr = String(m.userSnapshot?._id || m.userSnapshot?.userId || "");
                  return (
                    (mUserIdStr && mUserIdStr === senderIdStr) ||
                    (mSnapshotIdStr && mSnapshotIdStr === senderIdStr) ||
                    (mIdStr && mIdStr === senderIdStr)
                  );
                });
                if (found) {
                  const actualUserId =
                    (typeof found.userId === "object" && found.userId !== null)
                      ? (found.userId._id || found.userId.id)
                      : (found.userId || found._id);
                  senderInfo = {
                    ...found,
                    name: found.userSnapshot?.name || found.name || found.email,
                    avatar: found.userSnapshot?.avatar || found.avatar,
                    userId: actualUserId,
                    _id: actualUserId,
                    id: actualUserId,
                    userSnapshot: found.userSnapshot,
                  };
                } else if (senderIdStr) {
                  senderInfo = {
                    userId: senderIdStr,
                    _id: senderIdStr,
                    id: senderIdStr,
                  };
                }
              } else if (senderIdStr) {
                senderInfo = {
                  userId: senderIdStr,
                  _id: senderIdStr,
                  id: senderIdStr,
                };
              }

              const formatDateLabel = (d) => {
                if (!d) return "";
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));
                if (diffDays === 0) return "Today";
                if (diffDays === 1) return "Yesterday";
                return d.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
                });
              };

              return (
                <React.Fragment key={message._id || message.messageId || message.id || idx}>
                  {/* Date divider */}
                  {isFirstOfDay && currentMsgDate && (
                    <div className="flex justify-center my-3 select-none">
                      <span className="text-[11px] font-medium tracking-normal text-muted-foreground px-3.5 py-1 rounded-full bg-muted/80 border border-border/50 shadow-2xs backdrop-blur-xs">
                        {formatDateLabel(currentMsgDate)}
                      </span>
                    </div>
                  )}

                  <MessageScrollerItem
                    messageId={message._id || message.messageId || message.id}
                    scrollAnchor={false}
                  >
                    <MessageItem
                      message={message}
                      chatType={chatType}
                      currentUserId={currentUserId}
                      senderInfo={senderInfo}
                      otherUser={otherUser}
                      groupMembers={groupMembers}
                      clusterPosition={clusterPosition}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onReact={onReact}
                    />
                  </MessageScrollerItem>
                </React.Fragment>
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
