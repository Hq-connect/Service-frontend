import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Paperclip,
  SendHorizonal,
  Smile,
  AtSign,
  Users,
  X,
  Loader2,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadMedia } from "../hooks/useUploadMedia";
import { getFileTypeConfig } from "../utils/fileTypeConfig";
import mediaService from "../services/media.service";
import { getUserInitials, getAvatarStyle, getUserDisplayName } from "@/global/utils/user";

/**
 * Message composition input with auto-grow textarea, @mention autocomplete,
 * file attachments, reply-to banner, and live link preview.
 * @param {Function} onSend - Called with { text, attachments, replyTo, linkPreview, mentions, mentionAll }
 * @param {object|null} replyTo - Message being replied to
 * @param {Function} onCancelReply
 * @param {Function} [onTyping] - Called when typing starts/continues
 * @param {Function} [onStopTyping] - Called when typing stops
 * @param {boolean} disabled
 * @param {"dm"|"group"|"channel"} [chatType="dm"]
 * @param {Array} [members=[]] - Active members for @mention autocomplete
 * @param {string|null} [currentUserId=null]
 */
function MessageInput({
  onSend,
  replyTo = null,
  onCancelReply,
  onTyping,
  onStopTyping,
  disabled = false,
  chatType = "dm",
  members = [],
  currentUserId = null,
}) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [linkPreview, setLinkPreview] = useState(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [dismissedUrl, setDismissedUrl] = useState(null);

  // @Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  // Map of inserted displayName -> userId
  const [selectedMentionsMap, setSelectedMentionsMap] = useState({});

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadMedia();

  const supportsMentions = chatType === "group" || chatType === "channel";

  // Normalize member list for mention suggestions
  const mentionableMembers = useMemo(() => {
    if (!supportsMentions || !Array.isArray(members)) return [];
    const seen = new Set();
    const list = [];

    for (const m of members) {
      if (m.leftAt) continue;
      const uid = String(
        (typeof m.userId === "object" && m.userId !== null
          ? m.userId._id || m.userId.id
          : m.userId) ||
          m._id ||
          m.id ||
          ""
      );
      if (!uid || seen.has(uid) || (currentUserId && uid === String(currentUserId))) {
        continue;
      }
      seen.add(uid);
      const displayName = getUserDisplayName(m);
      list.push({
        type: "user",
        userId: uid,
        displayName,
        avatar: m.userSnapshot?.avatar || m.avatar || null,
        role: m.role || "member",
        raw: m,
      });
    }
    return list;
  }, [supportsMentions, members, currentUserId]);

  const mentionOptions = useMemo(() => {
    if (!supportsMentions || mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();

    const options = [];
    if ("everyone".includes(q) || "channel".includes(q) || "all".includes(q) || q === "") {
      options.push({
        type: "everyone",
        userId: "everyone",
        displayName: "everyone",
        subtitle: `Notify everyone in this ${chatType}`,
      });
    }

    for (const item of mentionableMembers) {
      if (!q || item.displayName.toLowerCase().includes(q)) {
        options.push(item);
      }
    }

    return options.slice(0, 8);
  }, [supportsMentions, mentionQuery, mentionableMembers, chatType]);

  // Reset highlighted index when options change
  useEffect(() => {
    setMentionSelectedIndex(0);
  }, [mentionOptions.length, mentionQuery]);

  const detectMentionTrigger = (inputValue, cursorPosition) => {
    if (!supportsMentions) {
      setMentionQuery(null);
      return;
    }
    const textBeforeCursor = inputValue.slice(0, cursorPosition);
    // Match the last `@` preceded by start-of-line or whitespace
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]*)$/);
    if (match) {
      const queryStr = match[1];
      const atIdx = textBeforeCursor.lastIndexOf(`@${queryStr}`);
      setMentionQuery(queryStr);
      setMentionStartIndex(atIdx);
    } else {
      setMentionQuery(null);
      setMentionStartIndex(-1);
    }
  };

  const insertMentionOption = useCallback(
    (option) => {
      if (!option || mentionStartIndex < 0) return;
      const textarea = textareaRef.current;
      const cursorEnd = textarea ? textarea.selectionStart : text.length;
      const beforeAt = text.slice(0, mentionStartIndex);
      const afterCursor = text.slice(cursorEnd);
      const tagText = `@${option.displayName} `;
      const nextText = `${beforeAt}${tagText}${afterCursor}`;

      setText(nextText);
      if (option.type === "user" && option.userId) {
        setSelectedMentionsMap((prev) => ({
          ...prev,
          [option.displayName.toLowerCase()]: option.userId,
        }));
      }

      setMentionQuery(null);
      setMentionStartIndex(-1);

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus();
          const newCursorPos = beforeAt.length + tagText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [mentionStartIndex, text]
  );

  const handleTriggerMentionButton = () => {
    if (!supportsMentions || disabled || isUploading) return;
    const textarea = textareaRef.current;
    const needsSpace = text.length > 0 && !/\s$/.test(text);
    const nextText = `${text}${needsSpace ? " @" : "@"}`;
    setText(nextText);
    setMentionQuery("");
    setMentionStartIndex(nextText.length - 1);
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(nextText.length, nextText.length);
      }
    });
  };

  // URL Detection & Link Preview fetch
  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const match = text.match(urlRegex);

    if (!match) {
      setLinkPreview(null);
      return;
    }

    const detectedUrl = match[0];
    if (detectedUrl === dismissedUrl) return;
    if (linkPreview?.url === detectedUrl) return;

    const timer = setTimeout(async () => {
      try {
        setIsFetchingPreview(true);
        const data = await mediaService.fetchLinkPreview(detectedUrl);
        setLinkPreview(data);
      } catch (err) {
        console.error("Failed to fetch link preview:", err);
      } finally {
        setIsFetchingPreview(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [text, dismissedUrl, linkPreview]);

  const handleDismissLinkPreview = () => {
    if (linkPreview) {
      setDismissedUrl(linkPreview.url);
    }
    setLinkPreview(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      e.target.value = null;
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSend = useCallback(async () => {
    const trimmedText = text.trim();
    if ((!trimmedText && selectedFiles.length === 0) || disabled || isUploading) return;

    try {
      let attachments = [];
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(selectedFiles);
      }

      // Extract mentions & mentionAll from final text
      const lowerText = trimmedText.toLowerCase();
      const mentionAll =
        supportsMentions &&
        (/(?:^|\s)@(everyone|channel)\b/i.test(trimmedText));

      const resolvedMentionIds = new Set();
      if (supportsMentions && trimmedText.includes("@")) {
        // Check explicitly selected mentions from map
        for (const [nameKey, uid] of Object.entries(selectedMentionsMap)) {
          if (lowerText.includes(`@${nameKey}`)) {
            resolvedMentionIds.add(uid);
          }
        }
        // Also match any member whose displayName or firstName is @mentioned
        for (const m of mentionableMembers) {
          const fullLower = m.displayName.toLowerCase();
          const firstLower = fullLower.split(" ")[0];
          if (
            (fullLower && lowerText.includes(`@${fullLower}`)) ||
            (firstLower && new RegExp(`(?:^|\\s)@${firstLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(trimmedText))
          ) {
            resolvedMentionIds.add(m.userId);
          }
        }
      }

      onStopTyping?.();
      onSend?.({
        text: trimmedText,
        attachments,
        replyTo: replyTo?._id ?? null,
        linkPreview: linkPreview || null,
        mentions: Array.from(resolvedMentionIds),
        mentionAll: Boolean(mentionAll),
      });

      setText("");
      setSelectedFiles([]);
      setLinkPreview(null);
      setDismissedUrl(null);
      setShowEmojiPicker(false);
      setMentionQuery(null);
      setSelectedMentionsMap({});
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Failed to upload attachments / send message:", err);
    }
  }, [
    text,
    selectedFiles,
    disabled,
    isUploading,
    uploadFiles,
    onSend,
    replyTo,
    linkPreview,
    supportsMentions,
    selectedMentionsMap,
    mentionableMembers,
    onStopTyping,
  ]);

  const handleKeyDown = (e) => {
    if (mentionOptions.length > 0 && mentionQuery !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionSelectedIndex((prev) => (prev + 1) % mentionOptions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionSelectedIndex((prev) =>
          prev - 1 < 0 ? mentionOptions.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMentionOption(mentionOptions[mentionSelectedIndex] || mentionOptions[0]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const targetHeight = Math.min(Math.max(textarea.scrollHeight, 32), 140);
    textarea.style.height = `${targetHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 140 ? "auto" : "hidden";
  }, [text]);

  const replyPreviewText = replyTo?.content?.text ?? "Attachment";
  const isSendDisabled = disabled || isUploading || (!text.trim() && selectedFiles.length === 0);

  return (
    <div className="relative px-4 pb-4 pt-1.5 shrink-0 bg-background">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* @Mention Autocomplete Floating Menu */}
      {supportsMentions && mentionQuery !== null && mentionOptions.length > 0 && (
        <div className="mb-2 w-full sm:w-80 bg-popover border border-border rounded-xl shadow-popover overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-1 duration-100">
          <div className="px-3 py-1.5 border-b border-border/60 bg-muted/40 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Mention someone
            </span>
            <span className="text-[10px] text-muted-foreground">↑↓ to navigate · Enter</span>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-border/30">
            {mentionOptions.map((opt, idx) => {
              const isHighlighted = idx === mentionSelectedIndex;
              if (opt.type === "everyone") {
                return (
                  <button
                    key="everyone"
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMentionOption(opt);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                      isHighlighted ? "bg-accent text-foreground" : "hover:bg-accent/50"
                    )}
                  >
                    <div className="size-7 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Users className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">@everyone</p>
                      <p className="text-[10px] text-muted-foreground truncate">{opt.subtitle}</p>
                    </div>
                  </button>
                );
              }

              const initials = getUserInitials(opt.raw || opt.displayName);
              const avatarStyle = getAvatarStyle(opt.raw || opt.userId);

              return (
                <button
                  key={opt.userId}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMentionOption(opt);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors cursor-pointer",
                    isHighlighted ? "bg-accent text-foreground" : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="size-7">
                      {opt.avatar && <AvatarImage src={opt.avatar} />}
                      <AvatarFallback style={avatarStyle} className="text-[10px] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate">{opt.displayName}</span>
                  </div>
                  {opt.role && opt.role !== "member" && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      {opt.role}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reply-to banner */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/70 rounded-xl border-l-2 border-primary border border-border/60 animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Replying to message
            </p>
            <p className="text-xs text-foreground truncate mt-0.5">{replyPreviewText}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Emoji picker bar */}
      {showEmojiPicker && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-popover/95 backdrop-blur-md rounded-xl border border-border shadow-popover w-fit animate-in fade-in slide-in-from-bottom-2 duration-100">
          {["👍", "❤️", "😂", "😮", "🎉", "🔥", "🙏", "👀", "🚀", "✨"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText((prev) => prev + emoji);
                textareaRef.current?.focus();
              }}
              className="hover:scale-125 transition-transform duration-100 text-lg p-1"
            >
              {emoji}
            </button>
          ))}
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(false)}
            className="size-6 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Pending File Attachments Preview Chips */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/30 rounded-xl border border-border/60 max-h-28 overflow-y-auto">
          {selectedFiles.map((file, idx) => {
            const isImage = file.type.startsWith("image/");
            const previewUrl = isImage ? URL.createObjectURL(file) : null;
            const sizeKb = (file.size / 1024).toFixed(0);
            const config = getFileTypeConfig(file.name, file.type, isImage ? "image" : "file", "");
            const Icon = config.icon;

            return (
              <div
                key={idx}
                className={cn(
                  "relative group flex items-center gap-2 p-1.5 rounded-lg text-xs max-w-[230px] transition-all shadow-2xs",
                  config.borderAccent
                )}
              >
                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="size-8 object-cover rounded shrink-0 border border-border"
                  />
                ) : (
                  <div className={cn("size-8 rounded-md flex items-center justify-center shrink-0 shadow-2xs", config.bgColor)}>
                    <Icon className={cn("size-4", config.iconColor)} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate text-[11px] leading-tight">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-muted-foreground">{sizeKb} KB</span>
                    <span className={cn("px-1 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider", config.badgeColor)}>
                      {config.label}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  disabled={isUploading}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5 shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Link Preview Card */}
      {isFetchingPreview ? (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/40 rounded-xl border border-border text-xs animate-pulse">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-muted-foreground text-[11px]">Fetching link preview...</span>
        </div>
      ) : linkPreview ? (
        <div className="relative group flex items-center gap-3 mb-2 p-2.5 bg-card rounded-xl border border-border shadow-xs max-w-full">
          {linkPreview.image ? (
            <img
              src={linkPreview.image}
              alt={linkPreview.title}
              className="size-11 object-cover rounded-lg shrink-0 border border-border"
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : (
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="size-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {linkPreview.favicon && (
                <img src={linkPreview.favicon} alt="" className="size-3 rounded-full shrink-0" />
              )}
              <span className="font-semibold uppercase tracking-wider text-primary truncate">
                {linkPreview.siteName || linkPreview.hostname}
              </span>
            </div>
            <p className="font-semibold text-foreground truncate text-xs mt-0.5">{linkPreview.title}</p>
            {linkPreview.description && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{linkPreview.description}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDismissLinkPreview}
            className="size-6 text-muted-foreground hover:text-foreground shrink-0 rounded-full hover:bg-muted"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {/* Input area */}
      <div
        className={cn(
          "flex items-end gap-1.5 sm:gap-2 rounded-[var(--radius-xl)] border border-input bg-card p-1.5 sm:p-2 transition-all duration-200 shadow-2xs",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 focus-within:shadow-xs"
        )}
      >
        {/* Attachment Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="size-8 rounded-[var(--radius-md)] shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Paperclip className="size-4" />
        </Button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            const val = e.target.value;
            setText(val);
            detectMentionTrigger(val, e.target.selectionStart);
            if (val.trim().length > 0) {
              onTyping?.();
            } else {
              onStopTyping?.();
            }
          }}
          onBlur={() => {
            onStopTyping?.();
            setTimeout(() => setMentionQuery(null), 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            supportsMentions
              ? "Write a message... (Type @ to mention)"
              : "Write a message..."
          }
          disabled={disabled || isUploading}
          rows={1}
          className="flex-1 min-h-[32px] max-h-[140px] resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground/60 px-2 py-1.5 text-sm leading-5 outline-none focus:outline-none focus:ring-0 custom-scrollbar"
        />

        {/* @Mention Quick Button (Group & Channel only) */}
        {supportsMentions && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Mention someone (@)"
            disabled={disabled || isUploading}
            onClick={handleTriggerMentionButton}
            className={cn(
              "size-8 rounded-[var(--radius-md)] shrink-0 transition-colors",
              mentionQuery !== null
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <AtSign className="size-4" />
          </Button>
        )}

        {/* Emoji Selector */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "size-8 rounded-[var(--radius-md)] shrink-0 transition-colors",
            showEmojiPicker ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Smile className="size-4" />
        </Button>

        {/* Send */}
        <Button
          type="button"
          size="icon"
          disabled={isSendDisabled}
          onClick={handleSend}
          className={cn(
            "size-8 rounded-[var(--radius-md)] shrink-0 transition-all duration-150 cursor-pointer",
            isSendDisabled
              ? "opacity-35 bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs active:scale-95"
          )}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizonal className="size-4" />
          )}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-1.5 pl-1 select-none">
        Enter to send, Shift+Enter for new line{supportsMentions ? " · @ to mention" : ""}
      </p>
    </div>
  );
}

export default MessageInput;
