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
import { Reply, FileText, Image, Film, Volume2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageActions from "./MessageActions";
import { useMessageScroller } from "@/components/ui/message-scroller";
import FileViewerModal from "./FileViewerModal";
import { getFileTypeConfig } from "../utils/fileTypeConfig";
import mediaService from "../services/media.service";

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

  // Local editing & viewer states
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content?.text ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState(null);
  const [autoLinkPreview, setAutoLinkPreview] = useState(null);

  // Auto-fetch link preview fallback if text contains a URL and no linkPreview is attached
  React.useEffect(() => {
    if (message.content?.linkPreview) return;
    const text = message.content?.text;
    if (!text) return;

    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const match = text.match(urlRegex);
    if (!match) return;

    const url = match[0];
    let isMounted = true;
    mediaService
      .fetchLinkPreview(url)
      .then((data) => {
        if (isMounted && data) {
          setAutoLinkPreview(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [message.content?.linkPreview, message.content?.text]);

  const activeLinkPreview = message.content?.linkPreview || autoLinkPreview;

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
              variant={isOwn ? ((message.content?.text || activeLinkPreview) ? "default" : "ghost") : ((message.content?.text || activeLinkPreview) ? "outline" : "ghost")} 
              className={cn(
                "max-w-full transition-all duration-500",
                isHighlighted && (isOwn 
                  ? "ring-2 ring-primary ring-offset-2 scale-[1.02] duration-300" 
                  : "ring-2 ring-primary ring-offset-2 scale-[1.02] bg-primary/5 duration-300"
                )
              )}
            >
              {/* Attachments FIRST */}
              {!isEditing && (message.content?.attachments ?? []).length > 0 && (
                <div className="flex flex-col gap-2 p-1.5 pb-1">
                  {message.content.attachments.map((att, idx) => {
                    const config = getFileTypeConfig(att.name, att.mimeType, att.type, att.url);
                    const Icon = config.icon;

                    return att.type === "image" ? (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerAttachment(att);
                        }}
                        className="block max-w-[280px] overflow-hidden rounded-lg border border-border/40 hover:opacity-90 transition-opacity text-left cursor-pointer shadow-xs"
                      >
                        <img
                          src={att.url}
                          alt={config.displayName}
                          className="w-full max-h-[220px] object-cover"
                        />
                      </button>
                    ) : (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerAttachment(att);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer text-left w-full shadow-xs group/att max-w-[320px]",
                          config.borderAccent
                        )}
                      >
                        <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover/att:scale-105", config.bgColor)}>
                          <Icon className={cn("size-5", config.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="font-semibold text-foreground truncate text-xs leading-tight">
                            {config.displayName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                            <span>{config.subtext}</span>
                            {att.size && (
                              <>
                                <span>·</span>
                                <span>{(att.size / 1024).toFixed(0)} KB</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shrink-0 shadow-2xs", config.badgeColor)}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Message Text SECOND */}
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
                Boolean(message.content?.text || activeLinkPreview) && (
                  <BubbleContent className={cn("flex flex-col gap-2 p-3", activeLinkPreview && "w-[340px] max-w-full")}>
                    {message.content?.text && (
                      <p className="text-sm leading-relaxed break-all select-text">{message.content.text}</p>
                    )}
                    {/* Rich Link Preview Card */}
                    {activeLinkPreview && (
                      <a
                        href={activeLinkPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "block w-full rounded-lg overflow-hidden border transition-all duration-200 shadow-xs group/link text-left mt-1",
                          isOwn
                            ? "bg-black/20 hover:bg-black/30 border-white/20 text-primary-foreground"
                            : "bg-muted/50 hover:bg-muted/80 border-border/80 text-foreground"
                        )}
                      >
                        {activeLinkPreview.image && (
                          <div className="w-full h-36 overflow-hidden bg-black/20 relative">
                            <img
                              src={activeLinkPreview.image}
                              alt={activeLinkPreview.title}
                              className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-300"
                              onError={(e) => (e.target.parentElement.style.display = "none")}
                            />
                          </div>
                        )}
                        <div className="p-2.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider truncate opacity-90">
                              {activeLinkPreview.favicon && (
                                <img
                                  src={activeLinkPreview.favicon}
                                  alt=""
                                  className="size-3.5 rounded-full shrink-0"
                                />
                              )}
                              <span className="truncate">{activeLinkPreview.siteName || activeLinkPreview.hostname}</span>
                            </div>
                            <ExternalLink className="size-3.5 opacity-60 group-hover/link:opacity-100 transition-opacity shrink-0" />
                          </div>
                          <p className="font-semibold text-xs leading-snug line-clamp-2">
                            {activeLinkPreview.title}
                          </p>
                          {activeLinkPreview.description && (
                            <p className="text-[11px] opacity-80 line-clamp-2 mt-1 leading-normal">
                              {activeLinkPreview.description}
                            </p>
                          )}
                        </div>
                      </a>
                    )}
                  </BubbleContent>
                )
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

      {/* In-app File Viewer Modal */}
      <FileViewerModal
        open={!!viewerAttachment}
        onOpenChange={(open) => {
          if (!open) setViewerAttachment(null);
        }}
        attachment={viewerAttachment}
      />
    </div>
  );
}

export default MessageItem;
