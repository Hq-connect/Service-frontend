import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle, RotateCcw, Send, X, MessageSquare, Trash2 } from "lucide-react";
import { getUserProfile, getUserColor, getInitials } from "../utils/userProfile";

export { getUserColor, getInitials };

/**
 * Strip HTML tags for display purposes
 */
export function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Format a timestamp as a relative or short absolute string
 */
function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Inline Comment Pins — renders comment avatar pins with user initials in the editor margin and
 * shows a popup thread when clicked.
 *
 * @param {{
 *   editor: any,
 *   editorContainerRef: React.RefObject<HTMLElement>,
 *   comments: Array,
 *   currentUserId: string,
 *   currentUserName: string,
 *   currentUserProfile: object,
 *   onResolve: Function,
 *   onReopen: Function,
 *   onAddReply: Function,
 *   onDelete: Function
 * }} props
 */
export default function InlineCommentPins({
  editor,
  editorContainerRef,
  comments = [],
  currentUserId,
  currentUserName,
  currentUserProfile,
  onResolve,
  onReopen,
  onAddReply,
  onDelete,
}) {
  const [pins, setPins] = useState([]);
  const [openCommentId, setOpenCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const replyInputRef = useRef(null);
  const popupRef = useRef(null);

  // Recompute pin positions whenever comments or editor state changes
  const computePins = useCallback(() => {
    if (!editor || !editorContainerRef?.current) return;

    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const proseMirrorEl = editorContainerRef.current.querySelector(".ProseMirror");
    if (!proseMirrorEl) return;

    const newPins = [];

    for (const comment of comments) {
      if (comment.status === "resolved") continue;

      let top = null;

      // Strategy 1: use blockId → find element with data-id or id
      if (comment.blockId) {
        const blockEl = proseMirrorEl.querySelector(`[data-id="${comment.blockId}"], [id="${comment.blockId}"]`);
        if (blockEl) {
          const rect = blockEl.getBoundingClientRect();
          top = rect.top - containerRect.top + 4;
        }
      }

      // Strategy 2: use anchorFrom ProseMirror position
      if (top === null && typeof comment.anchorFrom === "number") {
        try {
          const docSize = editor.state.doc.content.size;
          const clampedPos = Math.min(Math.max(1, comment.anchorFrom), Math.max(1, docSize - 1));
          const coords = editor.view.coordsAtPos(clampedPos);
          if (coords) {
            top = coords.top - containerRect.top + 2;
          }
        } catch {
          // ignore invalid positions
        }
      }

      // Strategy 3: fallback to proportional or stacked top offset so the pin is never dropped
      if (top === null || isNaN(top)) {
        top = 24 + newPins.length * 36;
      }

      const user = comment.userId;
      const userStr = String((typeof user === "object" ? user?._id || user?.id : user) || "");
      const isMe = Boolean(currentUserId && userStr === String(currentUserId));

      // Resolve author profile using the exact same getUserProfile helper as presence avatars
      let authorCandidate;
      if (comment.user && typeof comment.user === "object") {
        authorCandidate = comment.user;
      } else if (user && typeof user === "object") {
        authorCandidate = user;
      } else if (isMe && currentUserProfile) {
        authorCandidate = currentUserProfile;
      } else if (comment.userName && comment.userName !== "Collaborator") {
        authorCandidate = { name: comment.userName };
      } else if (isMe) {
        authorCandidate = currentUserProfile || { name: currentUserName || "You" };
      } else {
        authorCandidate = { name: comment.userName || "Collaborator" };
      }

      const profile = getUserProfile(authorCandidate);

      let authorName = profile.name;
      if (!authorName || authorName === "Collaborator") {
        if (isMe) {
          authorName = currentUserProfile?.name || currentUserName || "You";
        } else if (comment.userName && comment.userName !== "Collaborator") {
          authorName = comment.userName;
        } else {
          authorName = "Collaborator";
        }
      }

      let authorInitials = profile.initials;
      if (authorInitials === "U" && isMe && currentUserProfile?.initials) {
        authorInitials = currentUserProfile.initials;
      } else if (authorInitials === "U" && authorName && authorName !== "Collaborator") {
        const parts = authorName.trim().split(/\s+/);
        if (parts.length >= 2) {
          authorInitials = (parts[0][0] + parts[1][0]).toUpperCase();
        } else {
          authorInitials = authorName.slice(0, 2).toUpperCase();
        }
      }

      newPins.push({
        id: comment._id,
        top: Math.max(0, top),
        initials: authorInitials,
        name: authorName,
        avatarStyle: profile.avatarStyle,
        color: profile.color,
        comment,
      });
    }

    // Stack pins that are too close vertically (within 32px)
    newPins.sort((a, b) => a.top - b.top);
    for (let i = 1; i < newPins.length; i++) {
      if (newPins[i].top - newPins[i - 1].top < 32) {
        newPins[i].top = newPins[i - 1].top + 32;
      }
    }

    setPins(newPins);
  }, [editor, editorContainerRef, comments, currentUserId, currentUserName, currentUserProfile]);

  // Recompute on editor updates and window resize
  useEffect(() => {
    if (!editor) return;
    computePins();
    editor.on("update", computePins);
    editor.on("selectionUpdate", computePins);
    window.addEventListener("resize", computePins);
    return () => {
      editor.off("update", computePins);
      editor.off("selectionUpdate", computePins);
      window.removeEventListener("resize", computePins);
    };
  }, [editor, computePins]);

  // Close popup on outside click
  useEffect(() => {
    if (!openCommentId) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpenCommentId(null);
        setReplyText("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openCommentId]);

  // Auto-focus reply input when popup opens
  useEffect(() => {
    if (openCommentId) {
      setTimeout(() => replyInputRef.current?.focus(), 80);
    }
  }, [openCommentId]);

  const handleSendReply = async (commentId) => {
    const targetId = commentId || openCommentId || openPin?.id || openPin?.comment?._id;
    if (!targetId || !replyText.trim() || isSendingReply) return;
    setIsSendingReply(true);
    try {
      if (onAddReply) {
        await onAddReply({ commentId: targetId, content: replyText.trim() });
      }
      setReplyText("");
    } catch (err) {
      console.error("Failed to add reply:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const openPin = pins.find((p) => p.id === openCommentId);

  return (
    <>
      {/* Margin Avatar Pins */}
      {pins.map((pin) => (
        <button
          key={pin.id}
          type="button"
          title={`${pin.name}: ${stripHtml(pin.comment.selectedText || pin.comment.content)}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpenCommentId((prev) => (prev === pin.id ? null : pin.id));
            setReplyText("");
          }}
          style={{
            position: "absolute",
            top: `${pin.top}px`,
            right: "-38px",
            zIndex: openCommentId === pin.id ? 50 : 30,
            transform: openCommentId === pin.id ? "scale(1.15)" : "scale(1)",
            ...pin.avatarStyle,
          }}
          className="size-7 rounded-full flex items-center justify-center font-heading font-bold text-[10px] shadow-sm ring-2 ring-background transition-transform duration-100 hover:scale-110 select-none cursor-pointer"
        >
          {pin.initials}
        </button>
      ))}

      {/* Popup thread panel */}
      {openCommentId && openPin && (() => {
        const { comment, color, name, avatarStyle } = openPin;
        const replies = comment.replies || [];
        const isOwner =
          comment.userId?._id === currentUserId ||
          comment.userId === currentUserId;

        const fitsRight = editorContainerRef.current
          ? editorContainerRef.current.getBoundingClientRect().right + 300 <= window.innerWidth
          : true;

        return (
          <div
            ref={popupRef}
            style={{
              position: "absolute",
              top: Math.max(0, openPin.top - 8),
              right: fitsRight ? "-300px" : "32px",
              width: "285px",
              zIndex: 60,
            }}
            className="bg-card border border-border rounded-xl shadow-2xl text-xs animate-in zoom-in-95 fade-in duration-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thread header */}
            <div
              className="flex items-center justify-between px-3 py-2 border-b border-border"
              style={{ borderLeftWidth: "3px", borderLeftColor: color, borderLeftStyle: "solid" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="size-6 rounded-full flex items-center justify-center font-heading font-bold text-[10px] flex-shrink-0 shadow-xs ring-1 ring-border"
                  style={avatarStyle}
                >
                  {openPin.initials}
                </div>
                <span className="font-semibold text-foreground truncate max-w-[120px]">{name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {formatTime(comment.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {/* Resolve / Reopen */}
                {comment.status !== "resolved" ? (
                  <button
                    type="button"
                    title="Mark resolved"
                    onClick={() => {
                      onResolve(comment._id);
                      setOpenCommentId(null);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Reopen"
                    onClick={() => onReopen(comment._id)}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                )}
                {/* Delete (owner only) */}
                {isOwner && (
                  <button
                    type="button"
                    title="Delete thread"
                    onClick={() => {
                      onDelete(comment._id);
                      setOpenCommentId(null);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenCommentId(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Quoted text */}
            {comment.selectedText && (
              <div className="mx-3 mt-2 px-2 py-1.5 bg-muted/60 border-l-2 border-muted-foreground/40 rounded-r text-[11px] text-muted-foreground italic line-clamp-2">
                "{comment.selectedText}"
              </div>
            )}

            {/* Root comment content */}
            <div className="px-3 py-2 text-foreground/90 leading-relaxed font-sans">
              {comment.content}
            </div>

            {/* Replies */}
            {replies.length > 0 && (
              <div className="px-3 pb-2 space-y-2.5 border-t border-border/50 pt-2 max-h-48 overflow-y-auto custom-scrollbar">
                {replies.map((reply, idx) => {
                  const rUser = reply.userId;
                  const rUserStr = String((typeof rUser === "object" ? rUser?._id || rUser?.id : rUser) || "");
                  const isReplyMe = Boolean(currentUserId && rUserStr === String(currentUserId));
                  const rObj = (reply.user && typeof reply.user === "object")
                    ? reply.user
                    : (rUser && typeof rUser === "object")
                      ? rUser
                      : (isReplyMe && currentUserProfile)
                        ? currentUserProfile
                        : { name: reply.userName || (isReplyMe ? currentUserName || "You" : "Collaborator") };

                  const rProfile = getUserProfile(rObj);
                  const rName = (rProfile.name === "Collaborator" && isReplyMe)
                    ? (currentUserProfile?.name || currentUserName || "You")
                    : (reply.userName || rProfile.name);
                  const rInitials = (rProfile.initials === "U" && isReplyMe && currentUserProfile?.initials)
                    ? currentUserProfile.initials
                    : rProfile.initials;

                  return (
                    <div key={reply._id || idx} className="flex gap-2">
                      <div
                        className="size-5 rounded-full flex-shrink-0 flex items-center justify-center font-heading font-bold text-[8px] mt-0.5 shadow-xs"
                        style={rProfile.avatarStyle}
                      >
                        {rInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground text-[10px] truncate">{rName}</span>
                          <span className="text-muted-foreground text-[9px]">{formatTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed mt-0.5 text-[11px] whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reply input */}
            {comment.status !== "resolved" && (
              <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border bg-muted/20">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(comment._id);
                    }
                  }}
                  placeholder="Reply…"
                  className="flex-1 px-2.5 py-1 text-[11px] rounded-md border border-input bg-background text-foreground focus:outline-none focus:border-ring placeholder:text-muted-foreground min-w-0"
                />
                <button
                  type="button"
                  disabled={!replyText.trim() || isSendingReply}
                  onClick={() => handleSendReply(comment._id)}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}
