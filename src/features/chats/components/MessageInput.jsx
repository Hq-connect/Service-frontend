import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, SendHorizonal, Smile, X, FileText, Image as ImageIcon, Loader2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadMedia } from "../hooks/useUploadMedia";
import { getFileTypeConfig } from "../utils/fileTypeConfig";
import mediaService from "../services/media.service";

/**
 * Message composition input with auto-grow textarea, file attachments, reply-to banner, and live link preview.
 * @param {Function} onSend - Called with { text, attachments, replyTo, linkPreview }
 * @param {object|null} replyTo - Message being replied to
 * @param {Function} onCancelReply
 * @param {boolean} disabled
 */
function MessageInput({ onSend, replyTo = null, onCancelReply, disabled = false }) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [linkPreview, setLinkPreview] = useState(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [dismissedUrl, setDismissedUrl] = useState(null);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadMedia();

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
      e.target.value = null; // Reset input so same file can be chosen again
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

      onSend?.({
        text: trimmedText,
        attachments,
        replyTo: replyTo?._id ?? null,
        linkPreview: linkPreview || null,
      });

      setText("");
      setSelectedFiles([]);
      setLinkPreview(null);
      setDismissedUrl(null);
      setShowEmojiPicker(false);
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Failed to upload attachments / send message:", err);
    }
  }, [text, selectedFiles, disabled, isUploading, uploadFiles, onSend, replyTo, linkPreview]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const targetHeight = Math.min(textarea.scrollHeight, 140);
    textarea.style.height = `${targetHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 140 ? "auto" : "hidden";
  }, [text]);

  const replyPreviewText = replyTo?.content?.text ?? "Attachment";

  const isSendDisabled = disabled || isUploading || (!text.trim() && selectedFiles.length === 0);

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* Reply-to banner */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-muted rounded-lg border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium">Replying to message</p>
            <p className="text-xs text-foreground truncate">{replyPreviewText}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Emoji picker bar */}
      {showEmojiPicker && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/60 rounded-lg border border-border w-fit animate-in fade-in slide-in-from-bottom-2 duration-100">
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
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Pending File Attachments Preview Chips */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/30 rounded-lg border border-border/60 max-h-28 overflow-y-auto">
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
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/40 rounded-lg border border-border text-xs animate-pulse">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-muted-foreground text-[11px]">Fetching link preview...</span>
        </div>
      ) : linkPreview ? (
        <div className="relative group flex items-center gap-3 mb-2 p-2.5 bg-background rounded-xl border border-primary/40 shadow-xs max-w-full">
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
              <span className="font-semibold uppercase tracking-wider text-primary truncate">{linkPreview.siteName || linkPreview.hostname}</span>
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
            className="size-6 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {/* Input area */}
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-colors",
          "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30"
        )}
      >
        {/* Attachment Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground mb-0.5"
        >
          <Paperclip className="size-4" />
        </Button>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          disabled={disabled || isUploading}
          rows={1}
          className={cn(
            "flex-1 min-h-[36px] max-h-[140px] resize-none border-0 shadow-none p-0 text-sm leading-relaxed",
            "focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          )}
        />

        {/* Emoji Selector */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "size-8 shrink-0 mb-0.5 transition-colors",
            showEmojiPicker ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
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
          className="size-8 shrink-0 mb-0.5"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizonal className="size-4" />
          )}
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-1.5 pl-1">
        Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

export default MessageInput;
