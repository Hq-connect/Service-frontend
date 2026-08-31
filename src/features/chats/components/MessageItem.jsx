import React, { useState } from "react";
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
    message.senderId?._id === currentUserId;
  const isDeleted = !!message.deletedAt;

  // Local editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content?.text ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const displayName =
    senderInfo.name ||
    `${senderInfo.firstName ?? ""} ${senderInfo.lastName ?? ""}`.trim() ||
    senderInfo.email ||
    "Unknown";

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
              {senderInfo.avatar && (
                <AvatarImage src={senderInfo.avatar} alt={displayName} />
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

          {/* Reply reference */}
          {message.replyTo && (
            <div className="flex items-start gap-1.5 mb-1 px-3 py-1.5 rounded-lg bg-muted/60 border-l-2 border-muted-foreground/30 text-xs text-muted-foreground">
              <Reply className="size-3 shrink-0 mt-0.5" />
              <span className="truncate">
                {message.replyTo?.content?.text ?? "Replied message"}
              </span>
            </div>
          )}

          {/* 
           * Bubble Wrapper:
           * - w-fit max-w-[85%] so it tightly wraps the bubble up to 85% of MessageContent.
           * - relative so the toolbar positions against the bubble boundary.
           * - group/bubble scopes the hover trigger to just the bubble area.
           */}
          <div 
            className={cn(
              "relative group/bubble w-fit max-w-[85%] flex flex-col gap-1",
              isOwn ? "self-end" : "self-start"
            )}
          >
            {/* Bubble - overridden with max-w-full to prevent circular percentage collapse */}
            <Bubble variant={isOwn ? "default" : "outline"} className="max-w-full">
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

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-1 right-0 flex items-center gap-1.5 bg-background border border-border rounded-full shadow-md px-2 py-1 z-30 pointer-events-auto">
                {["👍", "❤️", "😂", "😮", "🎉", "🔥"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact?.(message._id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform duration-100 p-0.5 text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Hover Actions Toolbar */}
            {!isEditing && (
              <div 
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-100 z-20 pointer-events-none group-hover/bubble:pointer-events-auto",
                  isOwn ? "right-full pr-2" : "left-full pl-2"
                )}
              >
                <MessageActions
                  isOwn={isOwn}
                  onReply={() => onReply?.(message)}
                  onReact={() => setShowEmojiPicker(!showEmojiPicker)}
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => onDelete?.(message)}
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
