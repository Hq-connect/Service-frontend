import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import {
  useEditor,
  DomternalBubbleMenu,
  DomternalFloatingMenu,
  DomternalNotionColorPicker,
} from "@domternal/react";
import {
  StarterKit,
  Placeholder,
  UniqueID,
  TextStyle,
  TextColor,
  Highlight,
  BlockColor,
  NotionColorPicker,
  ListIndent,
} from "@domternal/core";
import {
  BlockHandle,
  BlockContextMenu,
  SlashCommand,
  SmartPaste,
  KeyboardReorder,
} from "@domternal/extension-block-controls";
import { TableOfContents, FloatingTocOutline } from "@domternal/extension-toc";
import CustomFormatting from "../extensions/customFormatting";
import CollaborationCursor, {
  yCursorPluginKey,
} from "../extensions/collaborationCursor";
import InlineCommentPins, { getUserColor, getInitials } from "./InlineCommentPins";
import "@domternal/theme";
import "../styles/editor.css";

export default function NotionEditor({
  content = "",
  onChange,
  onSelectionUpdate,
  readOnly = false,
  awareness = null,
  currentUserId = null,
  currentUserName = null,
  currentUserProfile = null,
  onOpenComment,
  onCreateComment,
  // Inline comments
  comments = [],
  onResolveComment,
  onReopenComment,
  onAddReply,
  onDeleteComment,
}) {
  const isUpdatingFromExternal = useRef(false);
  const updateTimerRef = useRef(null);
  const lastEmittedHtml = useRef("");
  const containerRef = useRef(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);

  // Inline comment compose state (rendered inside containerRef for pixel-perfect coordinates)
  const [activeComposer, setActiveComposer] = useState(null);
  const [composerText, setComposerText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const composerInputRef = useRef(null);
  const composerRef = useRef(null);

  // Keep awareness and user identity refs always current for the cursor plugin
  const awarenessRef = useRef(awareness);
  awarenessRef.current = awareness;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  // Configure extension suite with native collaborative cursor plugin
  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      UniqueID.configure({
        attributeName: "data-id",
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === "paragraph"
            ? "Type '/' for commands, '#' for heading, or just start writing..."
            : "",
      }),
      TextStyle,
      TextColor,
      Highlight,
      BlockColor,
      NotionColorPicker,
      ListIndent,
      BlockHandle.configure({ nested: true }),
      BlockContextMenu,
      SlashCommand,
      SmartPaste,
      KeyboardReorder,
      CustomFormatting,
      TableOfContents,
      FloatingTocOutline.configure({ anchor: "viewport" }),
      CollaborationCursor.configure({
        getAwareness: () => awarenessRef.current,
        getUserId: () => currentUserIdRef.current,
      }),
    ],
    []
  );

  // Use initial content reference so internal useEditor effects do not reset caret on external updates
  const initialContentRef = useRef(content);

  const { editor, editorRef } = useEditor({
    extensions: editorExtensions,
    content: initialContentRef.current || "<p></p>",
    editable: !readOnly,
    onUpdate: ({ editor: currentEditor }) => {
      if (isUpdatingFromExternal.current) return;
      const html = currentEditor.getHTML();
      lastEmittedHtml.current = html;
      if (onChange) {
        onChange(html, currentEditor.getJSON());
      }
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const { from, to, empty } = currentEditor.state.selection;
      const text = empty ? "" : currentEditor.state.doc.textBetween(from, to, " ");
      if (onSelectionUpdate) {
        onSelectionUpdate({ from, to, empty, text });
      }

      // Update floating selection comment pill coordinates relative to containerRef
      if (!empty && containerRef.current) {
        try {
          const startCoords = currentEditor.view.coordsAtPos(from);
          const containerRect = containerRef.current.getBoundingClientRect();
          if (startCoords && containerRect) {
            setSelectionBox({
              x: Math.max(10, startCoords.left - containerRect.left),
              y: Math.max(0, startCoords.top - containerRect.top - 34),
              text,
              from,
              to,
            });
          }
        } catch {
          setSelectionBox(null);
        }
      } else {
        setSelectionBox(null);
      }
    },
  });

  // Sync external content changes while preserving local focus and caret position
  useEffect(() => {
    if (!editor || !content) return;
    // Don't overwrite if content matches what we just typed and emitted
    if (content === lastEmittedHtml.current) return;
    const currentHtml = editor.getHTML();
    if (content === currentHtml) return;

    const isFocused = editor.isFocused;
    const { from, to } = editor.state.selection;
    isUpdatingFromExternal.current = true;
    editor.commands.setContent(content, false);
    if (isFocused) {
      try {
        const maxPos = editor.state.doc.content.size;
        editor.commands.setTextSelection({
          from: Math.min(Math.max(1, from), maxPos),
          to: Math.min(Math.max(1, to), maxPos),
        });
      } catch {
        // ignore selection restoration errors
      }
    }
    isUpdatingFromExternal.current = false;

    // After a full content replacement, the tr.mapping would shift peer cursors
    // to the end of the document. Dispatch a meta to force a rebuild from
    // live awareness so peer cursors land at their actual reported positions.
    try {
      editor.view.dispatch(
        editor.view.state.tr.setMeta(yCursorPluginKey, true)
      );
    } catch {
      // ignore if view is in a dispatch cycle
    }
  }, [content, editor]);

  // Sync read-only mode if permissions change
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Dismiss floating selection box on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (selectionBox) {
        setSelectionBox(null);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [selectionBox]);

  // Track hovered block for Notion block-level comment button
  const handleMouseMove = useCallback(
    (e) => {
      if (readOnly || !editorRef.current || !containerRef.current) return;
      const pm = editorRef.current.querySelector(".ProseMirror");
      if (!pm) return;

      let target = document.elementFromPoint(e.clientX, e.clientY);
      while (target && target.parentElement && target.parentElement !== pm) {
        target = target.parentElement;
      }

      if (target && target.parentElement === pm) {
        const rect = target.getBoundingClientRect();
        const parentRect = containerRef.current.getBoundingClientRect();
        setHoveredBlock({
          top: rect.top - parentRect.top,
          height: rect.height,
          element: target,
        });
      }
    },
    [readOnly, editorRef, containerRef]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredBlock(null);
  }, []);

  // Auto-focus composer input when opened
  useEffect(() => {
    if (activeComposer) {
      setTimeout(() => composerInputRef.current?.focus(), 80);
    }
  }, [activeComposer]);

  // Dismiss composer on outside click
  useEffect(() => {
    if (!activeComposer) return;
    const handleDown = (e) => {
      if (composerRef.current && !composerRef.current.contains(e.target)) {
        setActiveComposer(null);
        setComposerText("");
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [activeComposer]);

  const handlePostComment = async () => {
    if (!composerText.trim() || isSubmittingComment || !activeComposer) return;
    setIsSubmittingComment(true);
    try {
      if (onCreateComment) {
        await onCreateComment({
          content: composerText.trim(),
          selectedText: activeComposer.text || "",
          anchorFrom: activeComposer.from || 0,
          anchorTo: activeComposer.to || 0,
          blockId: activeComposer.blockId || null,
          userName: currentUserProfile?.name || currentUserName || "You",
        });
      }
      setActiveComposer(null);
      setComposerText("");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Standard Notion shortcut: Ctrl+Shift+M / Cmd+Shift+M for Comment
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (editor) {
          const { from, to, empty } = editor.state.selection;
          let text = "";
          let blockId = null;
          let blockFrom = from;
          let blockTo = to;
          if (!empty) {
            text = editor.state.doc.textBetween(from, to, " ");
            try {
              const $pos = editor.state.doc.resolve(from);
              blockId = $pos.parent.attrs?.["data-id"] || $pos.parent.attrs?.id || null;
            } catch {}
          } else {
            const $pos = editor.state.selection.$from;
            text = $pos.parent.textContent;
            blockId = $pos.parent.attrs?.["data-id"] || $pos.parent.attrs?.id || null;
            blockFrom = $pos.start();
            blockTo = $pos.end();
          }
          let y = 40;
          try {
            const coords = editor.view.coordsAtPos(from);
            const parentRect = containerRef.current?.getBoundingClientRect();
            if (coords && parentRect) {
              y = Math.max(10, coords.top - parentRect.top + 28);
            }
          } catch {}
          setActiveComposer({
            top: y,
            text,
            blockId,
            from: blockFrom,
            to: blockTo,
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  return (
    <div
      className="relative w-full min-h-[calc(100vh-140px)] px-4 sm:px-8 md:px-12 lg:px-20 py-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={containerRef}
        className="relative dm-editor dm-notion-mode max-w-4xl mx-auto focus:outline-none"
      >
        <div ref={editorRef} className="relative" />

        {/* Block-Level Hover Comment Button (Notion style) */}
        {hoveredBlock && !readOnly && !selectionBox && !activeComposer && (
          <button
            type="button"
            title="Comment on this block (Ctrl+Shift+M)"
            onClick={() => {
              const text = hoveredBlock.element?.innerText?.trim() || "";
              const blockId =
                hoveredBlock.element?.getAttribute("data-id") ||
                hoveredBlock.element?.getAttribute("id") ||
                hoveredBlock.element?.id ||
                null;
              let from = 0;
              let to = 0;
              if (editor && hoveredBlock.element) {
                try {
                  const pos = editor.view.posAtDOM(hoveredBlock.element, 0);
                  if (typeof pos === "number" && pos >= 0) {
                    from = pos;
                    to = pos + text.length;
                  }
                } catch {}
              }
              setActiveComposer({
                top: hoveredBlock.top + 4,
                text,
                blockId,
                from,
                to,
              });
              setHoveredBlock(null);
            }}
            style={{
              top: `${hoveredBlock.top + 4}px`,
              right: "0px",
            }}
            className="absolute z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm border border-border hover:border-primary/50 text-muted-foreground hover:text-primary shadow-sm hover:shadow-md transition-all duration-150 text-[11px] font-medium cursor-pointer group animate-in fade-in slide-in-from-right-1 duration-100"
          >
            <MessageSquare className="size-3 shrink-0 group-hover:scale-110 transition-transform duration-150" />
            <span className="hidden sm:inline">Comment</span>
          </button>
        )}

        {/* Floating Selection Comment Pill */}
        {selectionBox && !readOnly && !activeComposer && (
          <button
            type="button"
            title="Comment on highlighted text (Ctrl+Shift+M)"
            onClick={() => {
              let blockId = null;
              if (editor) {
                try {
                  const $pos = editor.state.doc.resolve(selectionBox.from);
                  blockId =
                    $pos.parent.attrs?.["data-id"] ||
                    $pos.parent.attrs?.id ||
                    null;
                } catch {}
              }
              setActiveComposer({
                top: selectionBox.top + 32,
                text: selectionBox.text,
                blockId: blockId || selectionBox.blockId,
                from: selectionBox.from,
                to: selectionBox.to,
              });
              setSelectionBox(null);
            }}
            style={{
              left: `${selectionBox.x}px`,
              top: `${selectionBox.y}px`,
            }}
            className="absolute z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-[11px] font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all duration-100 cursor-pointer animate-in zoom-in-90 fade-in duration-100"
          >
            <MessageSquare className="size-3 shrink-0" />
            <span>Comment</span>
          </button>
        )}

        {/* Floating Inline Comment Compose Popup (anchored right at the target line) */}
        {activeComposer && (
          <div
            ref={composerRef}
            style={{
              position: "absolute",
              top: `${activeComposer.top}px`,
              right: "0px",
              width: "290px",
              zIndex: 50,
            }}
            className="bg-card border border-border rounded-xl shadow-2xl p-3 space-y-2.5 animate-in zoom-in-95 fade-in duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div
                className="size-5 rounded-full flex items-center justify-center font-heading font-bold text-[9px] flex-shrink-0 shadow-xs"
                style={currentUserProfile?.avatarStyle || { backgroundColor: "#7c6af7", color: "#ffffff" }}
              >
                {currentUserProfile?.initials || "ME"}
              </div>
              <span className="text-xs font-semibold text-foreground truncate">
                {currentUserProfile?.name || currentUserName || "You"}
              </span>
            </div>
            {activeComposer.text && (
              <div className="px-2 py-1.5 bg-muted/60 border-l-2 border-primary/50 rounded-r text-[11px] text-muted-foreground italic line-clamp-2">
                "{activeComposer.text}"
              </div>
            )}
            <textarea
              ref={composerInputRef}
              rows={2}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
                if (e.key === "Escape") {
                  setActiveComposer(null);
                  setComposerText("");
                }
              }}
              placeholder="Add a comment… (Enter to post, Esc to cancel)"
              className="w-full p-2 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => { setActiveComposer(null); setComposerText(""); }}
                className="px-2.5 py-1 text-[11px] rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!composerText.trim() || isSubmittingComment}
                onClick={handlePostComment}
                className="px-3 py-1 text-[11px] rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
              >
                {isSubmittingComment ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        )}

        {editor && (
          <>
            {/* Inline selection bubble menu */}
            <DomternalBubbleMenu editor={editor} />

            {/* Notion-style "+" button popup menu */}
            <DomternalFloatingMenu editor={editor} requireExplicitTrigger />

            {/* Notion 9-color palette picker */}
            <DomternalNotionColorPicker editor={editor} />

            {/* Inline comment pins rendered in the editor margin */}
            {comments.length > 0 && (
              <InlineCommentPins
                editor={editor}
                editorContainerRef={containerRef}
                comments={comments}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserProfile={currentUserProfile}
                onResolve={onResolveComment}
                onReopen={onReopenComment}
                onAddReply={onAddReply}
                onDelete={onDeleteComment}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
