import React, { useState,useRef,useEffect } from "react";
import { MessageSquare, X, CheckCircle, RotateCcw, Send, Trash2 } from "lucide-react";
import { useDocumentComments } from "../hooks/useDocumentComments";
import useAuth from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function CommentsDrawer({ isOpen, onClose, documentId, currentSelection }) {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  const {
    comments,
    createComment,
    isCreatingComment,
    addReply,
    resolveComment,
    reopenComment,
    deleteComment,
  } = useDocumentComments(documentId);

  const [filter, setFilter] = useState("open");
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTexts, setReplyTexts] = useState({});

  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentSelection]);

  if (!isOpen) return null;

  const filteredComments = comments.filter((c) =>
    filter === "open" ? c.status !== "resolved" : c.status === "resolved"
  );

  const handleCreateComment = async (e) => {
    e?.preventDefault?.();
    if (!newCommentText.trim()) return;

    await createComment({
      content: newCommentText.trim(),
      selectedText: currentSelection?.text || "",
      anchorFrom: currentSelection?.from || 0,
      anchorTo: currentSelection?.to || 0,
      blockId: currentSelection?.blockId || null,
    });

    setNewCommentText("");
  };

  const handleAddReply = async (commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;

    await addReply({ commentId, content: text.trim() });
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
  };

  return (
    <aside className="w-80 border-l border-border bg-card text-card-foreground flex flex-col h-full shadow-lg z-30 animate-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <h3 className="text-sm font-heading font-semibold text-foreground">
            Comments
          </h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4 gap-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => setFilter("open")}
          className={`py-2 border-b-2 transition-colors ${
            filter === "open"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Open ({comments.filter((c) => c.status !== "resolved").length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("resolved")}
          className={`py-2 border-b-2 transition-colors ${
            filter === "resolved"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Resolved ({comments.filter((c) => c.status === "resolved").length})
        </button>
      </div>

      {/* New Comment Box (anchored to block/selection) */}
      <div className="p-3 border-b border-border bg-muted/30">
        {currentSelection?.text && (
          <div className="mb-2 p-2 bg-primary/10 border-l-2 border-primary rounded-r text-[11px] text-muted-foreground italic line-clamp-2">
            "{currentSelection.text}"
          </div>
        )}
        <form onSubmit={handleCreateComment} className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCreateComment(e);
              }
            }}
            placeholder={
              currentSelection?.text
                ? "Comment on highlighted block/text..."
                : "Add a comment..."
            }
            className="w-full p-2 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="xs"
              disabled={isCreatingComment || !newCommentText.trim()}
              className="gap-1 shadow-xs"
            >
              <Send className="size-3" />
              <span>Comment</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Comment Threads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {filteredComments.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {filter === "open" ? "No open comments" : "No resolved comments"}
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment._id}
              className="p-3 rounded-lg border border-border bg-card shadow-2xs space-y-2 text-xs"
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {comment.userId?.firstName
                    ? `${comment.userId.firstName} ${comment.userId.lastName || ""}`.trim()
                    : comment.userId?.name || "Collaborator"}
                </span>
                <div className="flex items-center gap-1">
                  {comment.status === "resolved" ? (
                    <button
                      type="button"
                      title="Reopen thread"
                      onClick={() => reopenComment(comment._id)}
                      className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                    >
                      <RotateCcw className="size-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Mark resolved"
                      onClick={() => resolveComment(comment._id)}
                      className="p-1 rounded text-muted-foreground hover:text-emerald-500 transition-colors"
                    >
                      <CheckCircle className="size-3" />
                    </button>
                  )}
                  {(comment.userId?._id === currentUserId || comment.userId === currentUserId) && (
                    <button
                      type="button"
                      title="Delete thread"
                      onClick={() => deleteComment(comment._id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Anchored Quote if present */}
              {comment.selectedText && (
                <div className="p-1.5 bg-muted border-l-2 border-border text-[11px] text-muted-foreground italic rounded-r line-clamp-2">
                  "{comment.selectedText}"
                </div>
              )}

              {/* Comment Body */}
              <p className="text-foreground/90 whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* Replies */}
              {comment.replies?.length > 0 && (
                <div className="pt-2 pl-2 border-l border-border space-y-1.5">
                  {comment.replies.map((reply, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-medium text-[11px] text-muted-foreground">
                        {reply.userId?.firstName
                          ? `${reply.userId.firstName} ${reply.userId.lastName || ""}`.trim()
                          : "Collaborator"}
                      </div>
                      <div className="text-foreground">
                        {reply.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {comment.status !== "resolved" && (
                <div className="pt-1 flex gap-1">
                  <input
                    type="text"
                    value={replyTexts[comment._id] || ""}
                    onChange={(e) =>
                      setReplyTexts((prev) => ({
                        ...prev,
                        [comment._id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddReply(comment._id);
                      }
                    }}
                    placeholder="Reply..."
                    className="flex-1 px-2 py-1 text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:border-ring"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddReply(comment._id)}
                    className="p-1 text-primary hover:bg-primary/10 rounded"
                  >
                    <Send className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
