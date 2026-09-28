import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Share2,
  MessageSquare,
  Image,
  Smile,
  CheckCircle2,
  Cloud,
  ChevronLeft,
  Loader2,
  History,
  AlertCircle,
} from "lucide-react";
import NotionEditor from "../components/NotionEditor";
import VersionHistoryPanel from "../components/VersionHistoryPanel";
import ShareModal from "../components/ShareModal";
import { getUserProfile, extractUser, getUserDisplayName } from "../utils/userProfile";
import { useDocument } from "../hooks/useDocument";
import { useDocumentSync } from "../hooks/useDocumentSync";
import { useDocumentComments } from "../hooks/useDocumentComments";
import { documentKeys } from "../queries/document.keys";
import { socket } from "@/socket/config/socket.config";
import useAuth from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRESET_COVERS = [
  "linear-gradient(to right, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(to right, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(to right, #fa709a 0%, #fee140 100%)",
  "linear-gradient(to right, #667eea 0%, #764ba2 100%)",
  "linear-gradient(to right, #ff0844 0%, #ffb199 100%)",
  "linear-gradient(to top, #09203f 0%, #537895 100%)",
];

const EMOJI_CATEGORIES = [
  {
    category: "Frequently Used",
    emojis: ["📄", "📝", "💡", "🚀", "📊", "🎯", "📌", "🎨", "⚙️", "📚", "💼", "🔬", "✨", "🔥"],
  },
  {
    category: "Objects & Work",
    emojis: ["📋", "📂", "📈", "📉", "💻", "🖥️", "🛠️", "🔑", "🔒", "🏷️", "📦", "⏰", "📅", "✉️"],
  },
  {
    category: "Symbols & Status",
    emojis: ["⭐", "🌟", "⚡", "❤️", "👍", "✅", "⚠️", "🚨", "🎉", "🟢", "🟡", "🔴", "💬", "🏆"],
  },
  {
    category: "Nature & Fun",
    emojis: ["🌱", "🌿", "🌲", "☕", "🍕", "🍎", "☀️", "🌙", "🌊", "🔮", "💎", "🧩", "🕊️", "🐾"],
  },
];

export default function DocumentPage() {
  const queryClient = useQueryClient();
  const { documentId } = useParams();
  const navigate = useNavigate();

  const {
    document: doc,
    isLoading,
    isError,
    updateMetadata,
  } = useDocument(documentId);

  const {
    comments,
    createComment,
    addReply,
    resolveComment,
    reopenComment,
    deleteComment,
  } = useDocumentComments(documentId);
  const { user: authUser } = useAuth();
  const currentUser = extractUser(authUser);
  const currentUserName = getUserDisplayName(currentUser);
  const authUserId = currentUser?._id || currentUser?.id;

  const [customTitle, setCustomTitle] = useState(null);
  const [customIcon, setCustomIcon] = useState(null);
  const [customCover, setCustomCover] = useState(undefined);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [currentSelection, setCurrentSelection] = useState(null);

  const canEdit = doc?.userRole ? doc.userRole === "owner" || doc.userRole === "editor" : true;

  // Reset local overrides when navigating to a different document
  useEffect(() => {
    setCustomTitle(null);
    setCustomIcon(null);
    setCustomCover(undefined);
    setShowIconPicker(false);
    setShowCoverPicker(false);
    setIconSearch("");
    setEditorContent(null);
    setCurrentSelection(null);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    setSaveStatus("saved");
  }, [documentId]);

  // Real-time title and metadata synchronization across tabs/collaborators
  useEffect(() => {
    if (!socket || !documentId) return;

    const handleRemoteTitle = ({ documentId: remoteDocId, title: remoteTitle }) => {
      if (remoteDocId === documentId && remoteTitle !== undefined) {
        setCustomTitle(remoteTitle);
        queryClient.setQueryData(documentKeys.detail(documentId), (prev) => {
          if (!prev) return prev;
          return { ...prev, title: remoteTitle };
        });
      }
    };

    const handleRemoteMetadata = ({ documentId: remoteDocId, updates }) => {
      if (remoteDocId === documentId && updates) {
        if (updates.title !== undefined) setCustomTitle(updates.title);
        if (updates.icon !== undefined) setCustomIcon(updates.icon);
        if (updates.coverImage !== undefined) setCustomCover(updates.coverImage);
        queryClient.setQueryData(documentKeys.detail(documentId), (prev) => {
          if (!prev) return prev;
          return { ...prev, ...updates };
        });
      }
    };

    socket.on("doc:title:updated", handleRemoteTitle);
    socket.on("doc:metadata:updated", handleRemoteMetadata);

    return () => {
      socket.off("doc:title:updated", handleRemoteTitle);
      socket.off("doc:metadata:updated", handleRemoteMetadata);
    };
  }, [documentId, queryClient]);

  // Derived state from query doc
  const title = customTitle ?? (doc?.title || "Untitled");
  const icon = customIcon ?? (doc?.icon || "📄");
  const coverImage = customCover !== undefined ? customCover : (doc?.coverImage || null);

  const resolvedContent = useMemo(() => {
    if (!doc?.content) return "<p></p>";
    if (typeof doc.content === "string") return doc.content;
    if (doc.content?.html) return doc.content.html;
    if (doc.content?.type === "doc" && doc.content?.content?.length > 0) return doc.content;
    return "<p></p>";
  }, [doc?.content]);

  const [editorContent, setEditorContent] = useState(null);
  const currentContent = editorContent ?? resolvedContent;

  // Real-time collaborative sync
  const { activePeers, sendUpdate, sendAwareness, awareness, currentUserId: syncUserId } = useDocumentSync(documentId, {
    onRemoteUpdate: ({ content: remoteContent }) => {
      if (remoteContent) {
        setEditorContent(remoteContent);
      }
    },
  });
  const currentUserId = authUserId || syncUserId || "";
  const effectiveUserId = currentUserId;

  const currentProfile = useMemo(() => {
    return getUserProfile(authUser || currentUser || { name: currentUserName, _id: currentUserId });
  }, [authUser, currentUser, currentUserName, currentUserId]);

  const uniquePeers = useMemo(() => {
    const seen = new Set();
    return activePeers.filter((p) => {
      const profile = getUserProfile(p.user || p);
      const key = profile._id || profile.email || profile.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activePeers]);

  const titleTimerRef = useRef(null);
  const handleTitleChange = (e) => {
    if (!canEdit) return;
    const newTitle = e.target.value;
    setCustomTitle(newTitle);
    setSaveStatus("saving");

    if (socket && documentId) {
      socket.emit("doc:title:update", { documentId, title: newTitle });
    }

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      try {
        await updateMetadata({ title: newTitle.trim() || "Untitled" });
        setSaveStatus("saved");
        setCustomTitle(null);
      } catch (err) {
        console.error("Error saving title:", err);
        setSaveStatus("error");
      }
    }, 500);
  };

  const handleTitleBlur = async () => {
    if (!canEdit) return;
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    const finalTitle = (customTitle ?? title).trim() || "Untitled";
    if (customTitle !== null && customTitle.trim() !== (doc?.title || "Untitled")) {
      try {
        setSaveStatus("saving");
        await updateMetadata({ title: finalTitle });
        setSaveStatus("saved");
        setCustomTitle(null);
      } catch (err) {
        console.error("Error saving title on blur:", err);
        setSaveStatus("error");
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const editorEl = document.querySelector(".dm-editor .ProseMirror");
      if (editorEl) {
        editorEl.focus();
      }
    }
  };

  const saveStatusTimerRef = useRef(null);
  const handleEditorChange = useCallback(
    (html, json) => {
      setEditorContent(html);
      sendUpdate(html, json);
      if (saveStatus !== "saving") {
        setSaveStatus("saving");
      }
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = setTimeout(() => {
        setSaveStatus("saved");
      }, 1500);
    },
    [sendUpdate, saveStatus]
  );

  const handleSelectIcon = async (newIcon) => {
    if (!canEdit) return;
    setCustomIcon(newIcon);
    setShowIconPicker(false);
    setIconSearch("");
    if (socket && documentId) {
      socket.emit("doc:metadata:update", { documentId, updates: { icon: newIcon } });
    }
    try {
      await updateMetadata({ icon: newIcon });
    } catch (err) {
      console.error("Failed to update icon:", err);
    }
  };

  const handleSelectCover = async (cover) => {
    if (!canEdit) return;
    setCustomCover(cover);
    setShowCoverPicker(false);
    if (socket && documentId) {
      socket.emit("doc:metadata:update", { documentId, updates: { coverImage: cover } });
    }
    try {
      await updateMetadata({ coverImage: cover });
    } catch (err) {
      console.error("Failed to update cover:", err);
    }
  };

  const handleRemoveCover = async () => {
    if (!canEdit) return;
    setCustomCover(null);
    setShowCoverPicker(false);
    if (socket && documentId) {
      socket.emit("doc:metadata:update", { documentId, updates: { coverImage: null } });
    }
    try {
      await updateMetadata({ coverImage: null });
    } catch (err) {
      console.error("Failed to remove cover:", err);
    }
  };

  const isDocReady = Boolean(doc && String(doc._id) === String(documentId));

  if (isLoading || !isDocReady) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading document...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <p className="text-sm">Failed to load document or access denied.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/docs")}
        >
          Return to Docs
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-background text-foreground">
      {/* Main Document Canvas Column */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative">
        {/* Top Floating Action Bar */}
        <header className="sticky top-0 z-999 flex items-center justify-between h-14 px-6 bg-background/85 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => navigate("/docs")}
              title="All Documents"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{icon}</span>
              <span className="font-heading font-medium text-foreground truncate max-w-48 sm:max-w-xs">
                {title || "Untitled"}
              </span>
            </div>
            {/* Auto-save status */}
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground pl-2">
              {saveStatus === "saving" ? (
                <>
                  <Cloud className="size-3 animate-pulse text-primary" />
                  <span>Saving...</span>
                </>
              ) : saveStatus === "error" ? (
                <>
                  <AlertCircle className="size-3 text-destructive" />
                  <span className="text-destructive font-medium">Failed to save</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span>Saved</span>
                </>
              )}
            </div>
            {!canEdit && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground ml-1">
                View only
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Active Collaborator Presence Avatars */}
            {uniquePeers.length > 0 && (
              <div className="flex items-center -space-x-1.5 mr-2">
                {uniquePeers.map((peer, i) => {
                  const profile = getUserProfile(peer.user || peer);

                  return (
                    <div
                      key={peer.socketId || peer.clientId || profile._id || i}
                      title={`${profile.name} (Active now)`}
                      className="size-7 rounded-full ring-2 ring-background flex items-center justify-center font-heading font-bold text-[10px] shadow-sm cursor-default select-none transition-transform hover:scale-110"
                      style={profile.avatarStyle}
                    >
                      {profile.initials}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Version History Button */}
            <Button
              type="button"
              variant={isVersionsOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsVersionsOpen((prev) => !prev)}
              className="gap-1.5 text-xs"
              title="Version history"
            >
              <History className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">History</span>
            </Button>

            {/* Share Modal Button */}
            <Button
              type="button"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              className="gap-1.5 text-xs shadow-xs"
            >
              <Share2 className="size-3.5" />
              <span>Share</span>
            </Button>
          </div>
        </header>

        {/* Optional Cover Banner */}
        {coverImage && (
          <div
            className="w-full h-44 sm:h-52 relative group"
            style={{ background: coverImage }}
          >
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowCoverPicker(true)}
              >
                Change Cover
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemoveCover}
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Document Header & Canvas Area */}
        <div className="max-w-4xl w-full mx-auto px-6 sm:px-12 md:px-16 pt-8 pb-4">
          {/* Quick Header Controls (Add Cover / Add Icon) */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 opacity-60 hover:opacity-100 transition-opacity">
            {!coverImage && (
              <button
                type="button"
                onClick={() => setShowCoverPicker(true)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Image className="size-3.5" />
                <span>Add cover</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Smile className="size-3.5" />
              <span>Change icon</span>
            </button>
          </div>

          {/* Large Document Icon */}
          <div className="relative inline-block mb-3">
            <button
              type="button"
              onClick={() => setShowIconPicker((prev) => !prev)}
              className="text-5xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="Click to change icon"
            >
              {icon}
            </button>

            {/* Icon Picker Popover */}
            {showIconPicker && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => {
                    setShowIconPicker(false);
                    setIconSearch("");
                  }}
                />
                <div className="absolute left-0 top-full mt-2 z-40 w-80 max-h-96 p-3 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-100">
                  {/* Search and Quick Actions */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="Paste or search emoji..."
                      className="flex-1 px-2.5 py-1 text-xs rounded-md bg-accent/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    {iconSearch.trim() && (
                      <Button
                        type="button"
                        size="xs"
                        variant="default"
                        onClick={() => handleSelectIcon(iconSearch.trim())}
                      >
                        Use
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => handleSelectIcon("📄")}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </Button>
                  </div>

                  {/* Categorized Emoji Grid */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1 custom-scrollbar">
                    {EMOJI_CATEGORIES.map((cat) => {
                      const visibleEmojis = iconSearch.trim()
                        ? cat.emojis.filter((e) => e.includes(iconSearch.trim()))
                        : cat.emojis;
                      if (iconSearch.trim() && visibleEmojis.length === 0) return null;
                      return (
                        <div key={cat.category} className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                            {cat.category}
                          </span>
                          <div className="grid grid-cols-7 gap-1">
                            {visibleEmojis.map((emoji, idx) => (
                              <button
                                key={`${cat.category}-${idx}`}
                                type="button"
                                onClick={() => handleSelectIcon(emoji)}
                                className="size-8 text-lg flex items-center justify-center rounded-lg hover:bg-accent hover:scale-110 active:scale-95 transition-all cursor-pointer select-none"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cover Picker Popover */}
          {showCoverPicker && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowCoverPicker(false)}
              />
              <div className="relative z-40 mb-4 p-3 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Choose a cover gradient</span>
                  <button
                    type="button"
                    onClick={() => setShowCoverPicker(false)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COVERS.map((cov, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCover(cov)}
                      style={{ background: cov }}
                      className="h-12 rounded-lg border border-border/40 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Editable Document Title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            onFocus={(e) => {
              if (canEdit && title === "Untitled") {
                e.target.select();
              }
            }}
            readOnly={!canEdit}
            title={!canEdit ? "You have view-only access to this document" : ""}
            placeholder="Untitled"
            className={cn(
              "relative z-10 w-full text-4xl sm:text-5xl font-heading font-extrabold text-foreground bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/30 tracking-tight",
              !canEdit && "cursor-default select-text opacity-90"
            )}
          />
        </div>

        {/* Domternal Notion Editor Canvas */}
        <NotionEditor
          key={documentId}
          readOnly={!canEdit}
          content={currentContent}
          onChange={handleEditorChange}
          onSelectionUpdate={setCurrentSelection}
          awareness={awareness}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserProfile={currentProfile}
          onCreateComment={createComment}
          comments={comments}
          onResolveComment={resolveComment}
          onReopenComment={reopenComment}
          onAddReply={addReply}
          onDeleteComment={deleteComment}
        />
      </div>


      {/* Full-Sized Version History Modal */}
      <VersionHistoryPanel
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
        documentId={documentId}
        currentContent={currentContent}
        documentTitle={title}
      />

      {/* Collaborator & Share Permissions Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={documentId}
      />
    </div>
  );
}
