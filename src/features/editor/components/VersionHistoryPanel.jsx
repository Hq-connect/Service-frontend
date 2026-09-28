import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  History,
  X,
  RotateCcw,
  Clock,
  GitCommit,
  Loader2,
  Plus,
  Columns,
  Eye,
  FileDiff,
  CheckCircle2,
} from "lucide-react";
import { diffWordsWithSpace } from "diff";
import { useDocumentVersions } from "../hooks/useDocumentVersions";
import versionService from "../services/version.service";
import { Button } from "@/components/ui/button";
import { getUserProfile } from "../utils/userProfile";

/**
 * Universal content-to-text converter supporting HTML strings,
 * ProseMirror JSON AST documents, JSON strings, and plain text.
 */
export function contentToText(content) {
  if (!content) return "";

  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        return contentToText(parsed);
      } catch {}
    }
    // HTML string: strip tags while preserving paragraph & line breaks
    return trimmed
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/(h[1-6]|div|blockquote|tr|li)>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .split("\n")
      .map((line) => line.trim())
      .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
      .join("\n")
      .trim();
  }

  if (typeof content === "object") {
    if (typeof content.html === "string") {
      return contentToText(content.html);
    }

    const extractNode = (node) => {
      if (!node) return "";
      if (typeof node === "string") return node;
      if (node.text) return node.text;

      if (Array.isArray(node.content)) {
        const isBlock = [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "listItem",
          "blockquote",
          "codeBlock",
        ].includes(node.type);
        const childTexts = node.content.map(extractNode).filter(Boolean);
        return childTexts.join(isBlock ? " " : "");
      }
      return "";
    };

    if (Array.isArray(content.content)) {
      return content.content
        .map(extractNode)
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }
  }

  return "";
}

/**
 * Format ISO timestamp as human-readable
 */
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Full-Sized Version History Modal with Word-Level Visual Diff,
 * Side-by-Side Comparison, and Snapshot Timeline.
 */
export default function VersionHistoryPanel({
  isOpen,
  onClose,
  documentId,
  currentContent,
  documentTitle = "Document",
}) {
  const {
    versions,
    isLoading,
    refetch,
    createVersion,
    isCreatingVersion,
    restoreVersion,
    isRestoringVersion,
  } = useDocumentVersions(documentId);

  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [selectedSnapshotData, setSelectedSnapshotData] = useState(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);
  const [activeTab, setActiveTab] = useState("diff"); // 'diff' | 'split' | 'preview'
  const [isPromptingSnapshot, setIsPromptingSnapshot] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState("");
  const snapshotInputRef = useRef(null);

  // Always fetch fresh history without caching when opened
  useEffect(() => {
    if (isOpen) {
      refetch();
      setIsPromptingSnapshot(false);
      setSnapshotMessage("");
    }
  }, [isOpen, refetch]);

  // Focus snapshot input when opened
  useEffect(() => {
    if (isPromptingSnapshot) {
      setTimeout(() => snapshotInputRef.current?.focus(), 50);
    }
  }, [isPromptingSnapshot]);

  // Auto-select latest version when list loads
  useEffect(() => {
    if (isOpen && versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versions[0]._id);
    }
  }, [isOpen, versions, selectedVersionId]);

  // Load full snapshot content when selected version changes
  useEffect(() => {
    if (!selectedVersionId || !documentId || !isOpen) {
      setSelectedSnapshotData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingSnapshot(true);

    versionService
      .getVersionById(documentId, selectedVersionId)
      .then((data) => {
        if (isMounted) {
          setSelectedSnapshotData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load version snapshot:", err);
        if (isMounted) {
          setSelectedSnapshotData(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSnapshot(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [documentId, selectedVersionId, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isPromptingSnapshot) {
          setIsPromptingSnapshot(false);
          setSnapshotMessage("");
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPromptingSnapshot, onClose]);

  // Compute text representations
  const oldText = useMemo(() => {
    return contentToText(selectedSnapshotData?.contentSnapshot);
  }, [selectedSnapshotData]);

  const newText = useMemo(() => {
    return contentToText(currentContent);
  }, [currentContent]);

  // Word-level diff calculation
  const diffParts = useMemo(() => {
    if (!oldText && !newText) return [];
    return diffWordsWithSpace(oldText, newText);
  }, [oldText, newText]);

  // Word diff stats
  const { addedWords, removedWords } = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const part of diffParts) {
      const words = part.value.split(/\s+/).filter(Boolean).length;
      if (part.added) added += words;
      if (part.removed) removed += words;
    }
    return { addedWords: added, removedWords: removed };
  }, [diffParts]);

  const handleConfirmCreateSnapshot = async () => {
    const finalSummary = snapshotMessage.trim() || `Manual snapshot (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
    try {
      const res = await createVersion({
        changeSummary: finalSummary,
        content: currentContent,
      });
      await refetch();
      if (res?._id) {
        setSelectedVersionId(res._id);
      }
      setIsPromptingSnapshot(false);
      setSnapshotMessage("");
    } catch (err) {
      console.error("Failed to create snapshot:", err);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await restoreVersion(versionId);
      setConfirmRestoreId(null);
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Failed to restore version:", err);
    }
  };

  const selectedVersionMeta = versions.find((v) => v._id === selectedVersionId);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-[96vw] max-w-7xl h-[92vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-card-foreground animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-card/90 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <History className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-heading font-semibold text-foreground">
                  Version History
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                  {versions.length} {versions.length === 1 ? "snapshot" : "snapshots"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-sm sm:max-w-md">
                {documentTitle}
              </p>
            </div>
          </div>

          {/* View mode toggle tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("diff")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === "diff"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileDiff className="size-3.5" />
              <span>Visual Diff</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === "split"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="size-3.5" />
              <span>Side by Side</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === "preview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="size-3.5" />
              <span>Snapshot</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {isPromptingSnapshot ? (
              <div className="flex items-center gap-1 bg-muted/60 border border-primary/40 rounded-lg p-1 shadow-sm animate-in fade-in zoom-in-95 duration-100">
                <input
                  ref={snapshotInputRef}
                  type="text"
                  value={snapshotMessage}
                  onChange={(e) => setSnapshotMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmCreateSnapshot();
                    } else if (e.key === "Escape") {
                      setIsPromptingSnapshot(false);
                      setSnapshotMessage("");
                    }
                  }}
                  placeholder="Commit message (e.g. Added auth section)..."
                  className="text-xs px-2.5 py-1 bg-background border border-input rounded text-foreground placeholder:text-muted-foreground w-56 sm:w-72 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleConfirmCreateSnapshot}
                  disabled={isCreatingVersion}
                  className="h-7 text-xs px-2.5 cursor-pointer"
                >
                  {isCreatingVersion ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsPromptingSnapshot(false);
                    setSnapshotMessage("");
                  }}
                  className="h-7 text-xs px-2 cursor-pointer"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPromptingSnapshot(true)}
                disabled={isCreatingVersion}
                className="gap-1.5 text-xs h-8 cursor-pointer"
                title="Save a new version snapshot with commit message"
              >
                {isCreatingVersion ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                <span>New Snapshot</span>
              </Button>
            )}

            {selectedVersionId && (
              <Button
                type="button"
                size="sm"
                variant={confirmRestoreId === selectedVersionId ? "destructive" : "default"}
                onClick={() => {
                  if (confirmRestoreId === selectedVersionId) {
                    handleRestore(selectedVersionId);
                  } else {
                    setConfirmRestoreId(selectedVersionId);
                    setTimeout(() => setConfirmRestoreId(null), 4000);
                  }
                }}
                disabled={isRestoringVersion}
                className="gap-1.5 text-xs h-8 cursor-pointer"
              >
                {isRestoringVersion ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                <span>
                  {confirmRestoreId === selectedVersionId ? "Confirm Restore?" : "Restore"}
                </span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        {/* Modal Body: Left Timeline Sidebar + Right Large Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Timeline Sidebar */}
          <div className="w-72 sm:w-80 border-r border-border bg-muted/20 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-border/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Timeline History</span>
              {isLoading && <Loader2 className="size-3 animate-spin" />}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
              {versions.length === 0 && !isLoading && (
                <div className="text-center py-12 px-4 text-xs text-muted-foreground">
                  <GitCommit className="size-8 mx-auto mb-2 opacity-40" />
                  <p>No snapshots yet.</p>
                  <p className="mt-1 text-[11px]">Click "New Snapshot" to create your first milestone.</p>
                </div>
              )}

              {versions.map((v, idx) => {
                const isSelected = selectedVersionId === v._id;
                const authorName = v.authorName || (idx === 0 ? "You" : "Collaborator");
                const profile = getUserProfile({ name: authorName, _id: v.editedBy || v._id });

                return (
                  <button
                    key={v._id}
                    type="button"
                    onClick={() => {
                      setSelectedVersionId(v._id);
                      setConfirmRestoreId(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                      isSelected
                        ? "bg-card border-primary shadow-sm ring-1 ring-primary/20"
                        : "bg-transparent border-transparent hover:bg-card/60 hover:border-border/60"
                    }`}
                  >
                    <div
                      className="size-7 rounded-full flex items-center justify-center font-heading font-bold text-[10px] shrink-0 mt-0.5 shadow-xs"
                      style={profile.avatarStyle}
                    >
                      {profile.initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {v.changeSummary || "Snapshot"}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-primary/15 text-primary font-semibold shrink-0">
                            Latest
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                        <Clock className="size-3 shrink-0" />
                        <span>{formatDate(v.createdAt)}</span>
                      </div>

                      <div className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                        By <span className="font-medium text-foreground/80">{profile.name}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Canvas: Wide reader area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Diff Stats Banner */}
            <div className="flex items-center justify-between px-8 py-2.5 border-b border-border bg-card/40 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-medium text-muted-foreground">Changes vs Live:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <span>+{addedWords}</span> added
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                  <span>−{removedWords}</span> removed
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-emerald-500/70" />
                <span>Green = Added in current</span>
                <span className="inline-block size-2 rounded-full bg-rose-500/70 ml-2" />
                <span>Red strikethrough = Removed from this version</span>
              </div>
            </div>

            {/* Canvas Viewer */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
              {isLoadingSnapshot ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm">Loading snapshot details…</p>
                </div>
              ) : (
                <div className="max-w-5xl mx-auto w-full">
                  {/* Mode 1: Visual Diff */}
                  {activeTab === "diff" && (
                    <div className="leading-relaxed text-sm sm:text-base font-sans whitespace-pre-wrap selection:bg-primary/20 bg-card/60 p-6 sm:p-8 rounded-xl border border-border/60 min-h-[350px]">
                      {diffParts.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
                          <p className="font-medium text-foreground">No differences found</p>
                          <p className="text-xs mt-1">This version is identical to the current document.</p>
                        </div>
                      ) : (
                        diffParts.map((part, i) => {
                          if (part.added) {
                            return (
                              <mark
                                key={i}
                                className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-medium px-1 py-0.5 rounded mx-0.5 not-italic"
                                title="Added in current document"
                              >
                                {part.value}
                              </mark>
                            );
                          }
                          if (part.removed) {
                            return (
                              <del
                                key={i}
                                className="bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through px-1 py-0.5 rounded mx-0.5 not-italic opacity-80"
                                title="Removed from this version"
                              >
                                {part.value}
                              </del>
                            );
                          }
                          return <span key={i}>{part.value}</span>;
                        })
                      )}
                    </div>
                  )}

                  {/* Mode 2: Side by Side */}
                  {activeTab === "split" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
                      <div className="border border-border rounded-xl p-5 bg-card/40 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="text-xs font-semibold text-muted-foreground mb-3 pb-2 border-b border-border flex items-center justify-between">
                          <span>Selected Snapshot ({formatDate(selectedVersionMeta?.createdAt)})</span>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                          {oldText || <span className="text-muted-foreground italic">Empty document</span>}
                        </div>
                      </div>

                      <div className="border border-border rounded-xl p-5 bg-card/40 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="text-xs font-semibold text-muted-foreground mb-3 pb-2 border-b border-border flex items-center justify-between">
                          <span>Current Document (Live)</span>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
                          {newText || <span className="text-muted-foreground italic">Empty document</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Snapshot Preview */}
                  {activeTab === "preview" && (
                    <div className="leading-relaxed text-sm sm:text-base font-sans whitespace-pre-wrap text-foreground bg-card/60 p-6 sm:p-8 rounded-xl border border-border/60 min-h-[350px]">
                      {oldText || (
                        <div className="text-center py-16 text-muted-foreground">
                          <p>Snapshot is empty</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
