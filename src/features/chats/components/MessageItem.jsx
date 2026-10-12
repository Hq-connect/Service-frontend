import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, FileText, Image, Film, Volume2, ExternalLink, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageActions from "./MessageActions";
import { useMessageScroller } from "@/components/ui/message-scroller";
import FileViewerModal from "./FileViewerModal";
import { getFileTypeConfig } from "../utils/fileTypeConfig";
import mediaService from "../services/media.service";
import { getUserInitials, getAvatarStyle, getUserDisplayName } from "@/global/utils/user";

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
  clusterPosition = "single",
  chatType = "dm",
  otherUser,
  groupMembers = [],
}) {
  const msgSenderIdStr = String(message.senderId?._id || message.senderId?.userId || message.senderId || "");
  const currentUserIdStr = String(currentUserId || "");
  const isOwn = !!(msgSenderIdStr && currentUserIdStr && msgSenderIdStr === currentUserIdStr);
  const isDeleted = !!message.deletedAt;

  const { scrollToMessage } = useMessageScroller();
  const [isHighlighted, setIsHighlighted] = useState(false);

  React.useEffect(() => {
    const handleHighlight = (e) => {
      const targetId = String(e.detail?.messageId || "");
      const myId = String(message._id || message.messageId || message.id || "");
      if (targetId && myId && targetId === myId) {
        setIsHighlighted(true);
        const timer = setTimeout(() => setIsHighlighted(false), 1600);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener("highlight-message", handleHighlight);
    return () => window.removeEventListener("highlight-message", handleHighlight);
  }, [message._id, message.messageId, message.id]);

  const handleScrollToReply = useCallback((e) => {
    e.stopPropagation();
    const targetId = message.replyTo?._id ?? message.replyTo?.messageId ?? message.replyTo?.id;
    if (!targetId) return;

    const targetEl =
      document.getElementById(`msg-${targetId}`) ||
      document.querySelector(`[data-message-id="${targetId}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      scrollToMessage(targetId);
    }
    window.dispatchEvent(new CustomEvent("highlight-message", { detail: { messageId: targetId } }));
  }, [message.replyTo, scrollToMessage]);

  // Local editing & viewer states
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content?.text ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState(null);
  const [autoLinkPreview, setAutoLinkPreview] = useState(null);
  const containerRef = useRef(null);
  const [isInViewport, setIsInViewport] = useState(false);

  // Viewport intersection observer to lazy-fetch link previews
  React.useEffect(() => {
    if (message.content?.linkPreview) return;
    const text = message.content?.text;
    if (!text || !/(https?:\/\/[^\s]+)/i.test(text)) return;

    const el = containerRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setIsInViewport(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInViewport(true);
          obs.disconnect();
        }
      },
      { rootMargin: "150px", threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [message.content?.linkPreview, message.content?.text]);

  // Auto-fetch link preview fallback ONLY once visible in viewport
  React.useEffect(() => {
    if (!isInViewport) return;
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
  }, [isInViewport, message.content?.linkPreview, message.content?.text]);

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

  const replyTarget = message.replyTo?.senderId || message.replyTo?.sender;
  const replySenderIdStr = String(
    (typeof replyTarget === "object" && replyTarget !== null)
      ? replyTarget._id || replyTarget.userId || replyTarget.id || ""
      : replyTarget || ""
  );
  const isReplyToOwn = !!(replySenderIdStr && currentUserIdStr && replySenderIdStr === currentUserIdStr);

  const resolveReplyAuthor = () => {
    if (isReplyToOwn) return "You";

    // 1. If replyTarget is an object with a real name
    if (typeof replyTarget === "object" && replyTarget !== null) {
      const name = getUserDisplayName(replyTarget);
      if (name && !/^[0-9a-fA-F]{24}$/.test(name) && name !== "Member") {
        return name;
      }
      if (replyTarget.name && !/^[0-9a-fA-F]{24}$/.test(replyTarget.name)) {
        return replyTarget.name;
      }
    }

    // 2. In DMs: if reply is from the other person
    if (chatType === "dm" && otherUser) {
      const otherIdStr = String(otherUser._id || otherUser.userId || otherUser.id || "");
      if (!replySenderIdStr || replySenderIdStr === otherIdStr) {
        const name = getUserDisplayName(otherUser);
        if (name && !/^[0-9a-fA-F]{24}$/.test(name)) return name;
        if (otherUser.name) return otherUser.name;
      }
    }

    // 3. In Group chats: find in groupMembers
    if (groupMembers && groupMembers.length > 0 && replySenderIdStr) {
      const found = groupMembers.find((m) => {
        const mUserId = String(
          (typeof m.userId === "object" && m.userId !== null)
            ? m.userId._id || m.userId.id
            : m.userId || m._id || m.id || m.userSnapshot?._id || ""
        );
        return mUserId === replySenderIdStr;
      });
      if (found) {
        const name = getUserDisplayName(found);
        if (name && !/^[0-9a-fA-F]{24}$/.test(name) && name !== "Member") {
          return name;
        }
        if (found.name || found.userSnapshot?.name) {
          return found.name || found.userSnapshot?.name;
        }
      }
    }

    // 4. Fallback in DM is otherUser name
    if (chatType === "dm" && otherUser?.name) {
      return otherUser.name;
    }

    return "Member";
  };

  const replyAuthorName = resolveReplyAuthor();

  const replySnippet =
    message.replyTo?.content?.text ||
    (message.replyTo?.content?.attachments?.length ? "Attachment" : "Message");

  const initials = getUserInitials(senderInfo) || displayName.slice(0, 2).toUpperCase() || "U";
  const avatarStyle = getAvatarStyle(senderInfo);

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
      <div className={cn("px-4 py-1 flex", isOwn ? "justify-end" : "justify-start")}>
        <div className="rounded-2xl px-3 py-1.5 text-xs italic text-muted-foreground bg-muted/40 border border-border/40 select-none">
          This message was deleted
        </div>
      </div>
    );
  }

  const isClusterChild = clusterPosition === "middle" || clusterPosition === "end";

  return (
    <div
      ref={containerRef}
      id={`msg-${message._id || message.messageId || message.id}`}
      data-message-id={message._id || message.messageId || message.id}
      className={cn(
        "px-4 transition-colors group/row",
        isClusterChild ? "py-0.5" : "pt-2 pb-0.5",
        hasReactions && "pb-3.5"
      )}
    >
      <div className={cn("flex w-full min-w-0 gap-2", isOwn ? "justify-end" : "justify-start")}>
        {/* Avatar — group chats only, hide in clusters and replace with width spacer */}
        {chatType === "group" && !isOwn && (
          isClusterChild ? (
            <div className="w-8 shrink-0 select-none" />
          ) : (
            <div className="shrink-0 self-end mb-0.5">
              <Avatar className="size-8">
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                )}
                <AvatarFallback style={avatarStyle} className="text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )
        )}

        {/* Message content wrapper */}
        <div className={cn("flex flex-col min-w-0 max-w-[85%] md:max-w-[70%]", isOwn ? "items-end" : "items-start")}>
          {/* Group sender name — shown at head of cluster in clean foreground color */}
          {chatType === "group" && !isOwn && !isClusterChild && (
            <div className="text-xs font-semibold text-foreground mb-1 px-0.5 select-none">
              {displayName}
            </div>
          )}

          {/* Bubble wrapper with hover toolbar */}
          <div
            ref={bubbleRef}
            className={cn(
              "relative group/bubble w-fit max-w-full flex flex-col select-none touch-callout-none",
              isOwn ? "self-end items-end" : "self-start items-start"
            )}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            onTouchMove={movePress}
          >
            {/* Bubble Container - consistent uniform rounded-2xl geometry */}
            <div
              className={cn(
                "relative max-w-full rounded-2xl transition-all duration-300 overflow-hidden shadow-2xs",
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 border border-border/70 text-foreground",
                isHighlighted && (isOwn
                  ? "brightness-125 ring-2 ring-primary-foreground/70"
                  : "bg-primary/10 border-primary/50 ring-2 ring-primary/40"
                )
              )}
            >
              {/* Quoted Reply Card - seamlessly nested inside the bubble header */}
              {message.replyTo && (
                <div
                  onClick={handleScrollToReply}
                  className={cn(
                    "flex items-stretch gap-2 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer select-none transition-all hover:opacity-90 mx-2 mt-2",
                    isOwn
                      ? "bg-black/25 dark:bg-black/35 text-primary-foreground"
                      : "bg-background/90 dark:bg-card/90 text-foreground border border-border/50 shadow-2xs"
                  )}
                >
                  <div className={cn("w-1 rounded-full shrink-0", isOwn ? "bg-primary-foreground/90" : "bg-primary")} />
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className={cn(
                      "text-[10px] font-bold tracking-tight truncate",
                      isOwn ? "text-primary-foreground" : "text-primary font-semibold"
                    )}>
                      {replyAuthorName}
                    </span>
                    <span className={cn(
                      "text-[11px] truncate leading-snug",
                      isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {replySnippet}
                    </span>
                  </div>
                </div>
              )}
              {/* Attachments */}
              {!isEditing && (message.content?.attachments ?? []).length > 0 && (
                <div className="flex flex-col gap-2 p-1.5 pb-1">
                  {message.content.attachments.map((att, idx) => {
                    const config = getFileTypeConfig(att.name, att.mimeType, att.type, att.url);
                    const Icon = config.icon;

                    return att.type === "image" ? (
                      <div key={idx} className="relative">
                        <button
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
                        {!message.content?.text && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-white flex items-center gap-1 select-none pointer-events-none">
                            <span>{timeLabel}</span>
                            {isOwn && <CheckCheck className="size-3 text-white/90" />}
                          </div>
                        )}
                      </div>
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
                  {!message.content?.text && message.content?.attachments?.[0]?.type !== "image" && (
                    <div className={cn(
                      "flex items-center justify-end gap-1 px-1.5 pb-0.5 text-[10px] select-none",
                      isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
                    )}>
                      <span>{timeLabel}</span>
                      {isOwn && <CheckCheck className="size-3.5 text-primary-foreground/90 shrink-0" />}
                    </div>
                  )}
                </div>
              )}

              {/* Message Text & Integrated Timestamp */}
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
                  <div className={cn("px-3.5 py-2", activeLinkPreview && "w-[340px] max-w-full")}>
                    {message.content?.text && (
                      <div>
                        <span className="text-sm leading-relaxed break-words whitespace-pre-wrap select-text">
                          {message.content.text}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 ml-2.5 select-none text-[10px] tabular-nums whitespace-nowrap align-baseline translate-y-0.5",
                          isOwn ? "text-primary-foreground/75" : "text-muted-foreground"
                        )}>
                          {message.editedAt && (
                            <span className="text-[9px] italic opacity-85">edited</span>
                          )}
                          <span>{timeLabel}</span>
                          {isOwn && (
                            <CheckCheck className="size-3.5 text-primary-foreground/90 shrink-0" />
                          )}
                        </span>
                      </div>
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
                  </div>
                )
              )}

              {/* Reactions */}
              {!isEditing && hasReactions && (
                <div className={cn(
                  "absolute -bottom-2.5 z-10 flex items-center gap-1 rounded-full bg-card border border-border shadow-xs px-1.5 py-0.5 text-xs select-none",
                  isOwn ? "right-2" : "left-2"
                )}>
                  {Object.entries(reactionGroups).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onReact?.(message._id, emoji)}
                      className="flex items-center gap-1 px-1 py-0.5 rounded-full hover:bg-muted text-xs transition-colors cursor-pointer"
                    >
                      <span>{emoji}</span>
                      {count > 1 && <span className="text-[10px] font-semibold text-muted-foreground">{count}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
        </div>
      </div>

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

export default React.memo(MessageItem);
