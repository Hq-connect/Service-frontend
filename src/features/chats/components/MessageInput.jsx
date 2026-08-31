import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, SendHorizonal, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Message composition input with auto-grow textarea, attachment, and reply-to banner.
 * @param {Function} onSend - Called with { text, replyTo }
 * @param {object|null} replyTo - Message being replied to
 * @param {Function} onCancelReply
 * @param {boolean} disabled
 */
function MessageInput({ onSend, replyTo = null, onCancelReply, disabled = false }) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend?.({ text: trimmed, replyTo: replyTo?._id ?? null });
    setText("");
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }, [text, disabled, onSend, replyTo]);

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

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
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

      {/* Input area */}
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-colors",
          "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/30"
        )}
      >
        {/* Attachment */}
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
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
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 min-h-[36px] max-h-[140px] resize-none border-0 shadow-none p-0 text-sm leading-relaxed",
            "focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          )}
        />

        {/* Emoji Selector */}
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
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
          size="icon"
          disabled={disabled || !text.trim()}
          onClick={handleSend}
          className="size-8 shrink-0 mb-0.5"
        >
          <SendHorizonal className="size-4" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-1.5 pl-1">
        Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

export default MessageInput;
