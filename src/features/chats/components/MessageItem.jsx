import React, { useState, useRef, useCallback } from "react";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message";
import {
  Bubble,
  BubbleContent,
  BubbleReactions,
} from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, FileText, Image, Film, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageActions from "./MessageActions";
import { useMessageScroller } from "@/components/ui/message-scroller";

const ATTACHMENT_ICONS = {
  image: Image,
  video: Film,
  audio: Volume2,
  file: FileText,
};

/**
 * Single chat message row.
 *
 * Hover toolbar strategy:
 *  - Wraps the Bubble in a relative, w-fit container.
 *  - Toolbar is absolutely positioned relative to this bubble wrapper:
 *      - LEFT of the bubble (`right-full pr-2`) for own messages
 *      - RIGHT of the bubble (`left-full pl-2`) for others' messages
 *    (Padding prevents a "hover dead zone" gap where the toolbar would vanish).
 *  - Hover zone is restricted to the bubble container (`group-hover/bubble`)
 *    meaning empty space on the row doesn't trigger the toolbar.
 */
function MessageItem({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  senderInfo = {},
}) {
  const isOwn =
    message.senderId === currentUserId ||
    message.senderId?._id === currentUserId ||
    message.senderId?.userId === currentUserId;
  const isDeleted = !!message.deletedAt;

  const { scrollToMessage } = useMessageScroller();
  const [isHighlighted, setIsHighlighted] = useState(false);

  React.useEffect(() => {
    const handleHighlight = (e) => {
      if (e.detail?.messageId === message._id) {
        setIsHighlighted(true);
        const timer = setTimeout(() => setIsHighlighted(false), 2000);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener("highlight-message", handleHighlight);
    return () => window.removeEventListener("highlight-message", handleHighlight);
  }, [message._id]);

  // Local editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content?.text ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const bubbleRef = useRef(null);

  const startPress = useCallback(() => {
    isLongPressRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setShowMobileToolbar(true);
    }, 600); // 600ms long press
  }, []);

  const endPress = useCallback((e) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const movePress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  React.useEffect(() => {
    if (!showMobileToolbar) return;
    const handleDocumentClick = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        setShowMobileToolbar(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, [showMobileToolbar]);

  const displayName =
    senderInfo.userSnapshot?.name ||
    senderInfo.name ||
    `${senderInfo.firstName ?? ""} ${senderInfo.lastName ?? ""}`.trim() ||
    senderInfo.email ||
    "Unknown";

  const avatarUrl = senderInfo.userSnapshot?.avatar || senderInfo.avatar;

  const initials = displayName
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const seed = senderInfo.userId ?? senderInfo.email ?? senderInfo._id ?? "u";
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const avatarStyle = {
    backgroundColor: `hsl(${Math.abs(hash % 360)},55%,88%)`,
    color: `hsl(${Math.abs(hash % 360)},60%,30%)`,
  };

  const timeLabel = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const reactionGroups = (message.reactions ?? []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});
  const hasReactions = Object.keys(reactionGroups).length > 0;

  if (isDeleted) {
    return (
      <Message align={isOwn ? "end" : "start"} className="px-4 py-1">
        <MessageContent>
          <Bubble variant="ghost">
            <BubbleContent className="italic text-muted-foreground text-xs">
              This message was deleted.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
  }

  return (
    <div className={cn("px-4 py-0.5", hasReactions && "pb-3")}>
      <Message
        align={isOwn ? "end" : "start"}
        className="items-center"
      >
        {/* Avatar — others only */}
        {!isOwn && (
          <MessageAvatar>
            <Avatar className="size-8">
              {avatarUrl && (
                <AvatarImage src={avatarUrl} alt={displayName} />
              )}
              <AvatarFallback style={avatarStyle} className="text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </MessageAvatar>
        )}

        {/* Message content — full max width limit */}
        <MessageContent className="max-w-[70%]">
          {/* Sender name (others only) */}
          {!isOwn && (
            <MessageHeader>
              <span className="font-semibold text-foreground">{displayName}</span>
              <span className="ml-2 text-[10px] text-muted-foreground/70">{timeLabel}</span>
            </MessageHeader>
          )}

          {/* 
           * Bubble Wrapper:
           * - w-fit max-w-[85%] so it tightly wraps the bubble up to 85% of MessageContent.
           * - relative so the toolbar positions against the bubble boundary.
           * - group/bubble scopes the hover trigger to just the bubble area.
           * - contains reply reference so that the reference container matches bubble alignment and width.
           *   (preventing full-width stretching).
           */}
          <div 
            ref={bubbleRef}
            className={cn(
              "relative group/bubble w-fit max-w-[85%] flex flex-col gap-1 select-none touch-callout-none",
              isOwn ? "self-end items-end" : "self-start items-start"
            )}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            onTouchMove={movePress}
          >
            {/* Reply reference - nested here to align with bubble width and have proper hover styling */}
            {message.replyTo && (
              <div 
                onClick={() => {
                  const targetId = message.replyTo?._id ?? message.replyTo?.messageId;
                  if (targetId) {
                    scrollToMessage(targetId);
                    window.dispatchEvent(new CustomEvent("highlight-message", { detail: { messageId: targetId } }));
                  }
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-muted-foreground/80 hover:text-foreground cursor-pointer select-none transition-colors border-l-2 mb-0.5 max-w-full w-fit bg-muted/40 border-muted-foreground/20 hover:bg-muted/60"
                )}
              >
                <Reply className="size-3 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {message.replyTo?.content?.text ?? "Replied message"}
                </span>
              </div>
            )}

            {/* Bubble - overridden with max-w-full to prevent circular percentage collapse */}
            <Bubble 
              variant={isOwn ? "default" : "outline"} 
              className={cn(
                "max-w-full transition-all duration-500",
                isHighlighted && (isOwn 
                  ? "ring-2 ring-primary ring-offset-2 scale-[1.02] duration-300" 
                  : "ring-2 ring-primary ring-offset-2 scale-[1.02] bg-primary/5 duration-300"
                )
              )}
            >
              {isEditing ? (
                <div className="flex flex-col gap-2 p-2 min-w-[240px]">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-background text-foreground border border-input rounded-md p-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setIsEditing(false);
                        setEditText(message.content?.text ?? "");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={async () => {
                        if (editText.trim() && editText !== message.content?.text) {
                          await onEdit?.(message._id, editText.trim());
                        }
                        setIsEditing(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                message.content?.text && (
                  <BubbleContent>{message.content.text}</BubbleContent>
                )
              )}

              {/* Attachments */}
              {!isEditing && (message.content?.attachments ?? []).length > 0 && (
                <div className="flex flex-col gap-1 px-3 pb-3 pt-1">
                  {message.content.attachments.map((att, idx) => {
                    const Icon = ATTACHMENT_ICONS[att.type] ?? FileText;
                    return att.type === "image" ? (
                      <img
                        key={idx}
                        src={att.url}
                        alt={att.name ?? "attachment"}
                        className="rounded-md max-w-[260px] max-h-[200px] object-cover border border-border/40"
                      />
                    ) : (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-muted/60 text-xs">
                        <Icon className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{att.name ?? att.type}</span>
                        {att.size && (
                          <span className="text-muted-foreground ml-auto shrink-0">
                            {(att.size / 1024).toFixed(0)} kb
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reactions */}
              {!isEditing && hasReactions && (
                <BubbleReactions side="bottom" align={isOwn ? "end" : "start"}>
                  {Object.entries(reactionGroups).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(message._id, emoji)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-muted/80 text-xs transition-colors"
                    >
                      <span>{emoji}</span>
                      {count > 1 && <span className="text-muted-foreground">{count}</span>}
                    </button>
                  ))}
                </BubbleReactions>
              )}
            </Bubble>

            {/* Hover Actions Toolbar */}
            {!isEditing && (
              <div 
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 transition-opacity duration-100 z-20",
                  (showEmojiPicker || showMobileToolbar)
                    ? "opacity-100 pointer-events-auto" 
                    : "opacity-0 md:group-hover/bubble:opacity-100 pointer-events-none md:group-hover/bubble:pointer-events-auto",
                  isOwn ? "right-full pr-2" : "left-full pl-2"
                )}
              >
                <MessageActions
                  isOwn={isOwn}
                  onReply={() => {
                    onReply?.(message);
                    setShowMobileToolbar(false);
                  }}
                  onReact={(emoji) => {
                    onReact?.(message._id, emoji);
                    setShowEmojiPicker(false);
                    setShowMobileToolbar(false);
                  }}
                  onEdit={() => {
                    setIsEditing(true);
                    setShowMobileToolbar(false);
                  }}
                  onDelete={() => {
                    onDelete?.(message);
                    setShowMobileToolbar(false);
                  }}
                  showEmojiPicker={showEmojiPicker}
                  setShowEmojiPicker={setShowEmojiPicker}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <MessageFooter className={cn("gap-2 mt-0.5", hasReactions && "mt-3")}>
            {isOwn && (
              <span className="text-[10px] text-muted-foreground">{timeLabel}</span>
            )}
            {message.editedAt && (
              <span className="text-[10px] text-muted-foreground italic">edited</span>
            )}
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
}

export default MessageItem;
