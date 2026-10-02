import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
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
  Extension,
} from "@domternal/core";
import {
  BlockHandle,
  BlockContextMenu,
  SlashCommand,
  SmartPaste,
  KeyboardReorder,
} from "@domternal/extension-block-controls";
import { TableOfContents, FloatingTocOutline } from "@domternal/extension-toc";
import { ySyncPlugin, ySyncPluginKey } from "y-prosemirror";
import CustomFormatting from "../extensions/customFormatting";
import CollaborationCursor, {
  yCursorPluginKey,
} from "../extensions/collaborationCursor";
import InlineCommentPins from "./InlineCommentPins";
import { Plugin, PluginKey } from "prosemirror-state";
import "@domternal/theme";
import "../styles/editor.css";

const readOnlyPluginKey = new PluginKey("readOnlyGuard");

function createReadOnlyGuardExtension(getReadOnly, onAttemptEdit) {
  return Extension.create({
    name: "readOnlyGuard",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: readOnlyPluginKey,
          filterTransaction(tr) {
            if (getReadOnly() && tr.docChanged && !tr.getMeta(ySyncPluginKey)) {
              onAttemptEdit();
              return false;
            }
            return true;
          },
          props: {
            handleDOMEvents: {
              beforeinput(view, event) {
                if (getReadOnly()) {
                  event.preventDefault();
                  event.stopPropagation();
                  onAttemptEdit();
                  return true;
                }
                return false;
              },
              keydown(view, event) {
                if (getReadOnly()) {
                  const isCopyOrSelectAll =
                    (event.ctrlKey || event.metaKey) && ["c", "a"].includes(event.key?.toLowerCase());
                  const isModifierKeyOnly = ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key);
                  const isNavKey =
                    event.key?.startsWith("Arrow") ||
                    ["Home", "End", "PageUp", "PageDown", "Tab", "Escape"].includes(event.key);

                  if (!isCopyOrSelectAll && !isModifierKeyOnly && !isNavKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    onAttemptEdit();
                    return true;
                  }
                }
                return false;
              },
              paste(view, event) {
                if (getReadOnly()) {
                  event.preventDefault();
                  event.stopPropagation();
                  onAttemptEdit();
                  return true;
                }
                return false;
              },
              drop(view, event) {
                if (getReadOnly()) {
                  event.preventDefault();
                  event.stopPropagation();
                  onAttemptEdit();
                  return true;
                }
                return false;
              },
            },
          },
        }),
      ];
    },
  });
}

function createYSyncExtension(getFragment) {
  return Extension.create({
    name: "yjsSync",
    addProseMirrorPlugins() {
      const fragment = getFragment();
      if (!fragment) return [];
      return [ySyncPlugin(fragment)];
    },
  });
}

export default function NotionEditor({
  content = "",
  onChange,
  onSelectionUpdate,
  readOnly = false,
  awareness = null,
  currentUserId = null,
  currentUserName = null,
  currentUserProfile = null,
  yjsXmlFragment = null,
  onOpenComment,
  onCreateComment,
  comments = [],
  onResolveComment,
  onReopenComment,
  onAddReply,
  onDeleteComment,
}) {
  const updateTimerRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);

  const [activeComposer, setActiveComposer] = useState(null);
  const [composerText, setComposerText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const composerInputRef = useRef(null);
  const composerRef = useRef(null);

  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  const awarenessRef = useRef(awareness);
  awarenessRef.current = awareness;
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const yjsFragmentRef = useRef(yjsXmlFragment);
  yjsFragmentRef.current = yjsXmlFragment;

  const lastReadOnlyToastRef = useRef(0);
  const notifyReadOnly = useCallback(() => {
    const now = Date.now();
    if (now - lastReadOnlyToastRef.current > 1200) {
      lastReadOnlyToastRef.current = now;
      toast.error("You have view-only access. You cannot edit this document.");
    }
  }, []);

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
      createYSyncExtension(() => yjsFragmentRef.current),
      createReadOnlyGuardExtension(() => readOnlyRef.current, notifyReadOnly),
      CollaborationCursor.configure({
        getAwareness: () => awarenessRef.current,
        getUserId: () => currentUserIdRef.current,
      }),
    ],
    [notifyReadOnly]
  );

  const { editor, editorRef } = useEditor(
    {
      extensions: editorExtensions,
      content: content || "",
      history: false,
      editable: !readOnly,
      onUpdate: ({ editor: currentEditor, transaction }) => {
        if (readOnlyRef.current) return;
        if (transaction?.getMeta(ySyncPluginKey)) return;
        const html = currentEditor.getHTML();
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

        if (!empty && containerRef.current && !readOnly) {
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
    },
    [readOnly]
  );

  // Synchronize editable state and enforce contenteditable attribute
  useEffect(() => {
    if (!editor) return;

    editor.options.editable = !readOnly;
    if (editor.view) {
      editor.view.setProps({
        editable: () => !readOnly,
      });
      if (editor.view.dom) {
        editor.view.dom.contentEditable = !readOnly ? "true" : "false";
        editor.view.dom.setAttribute("contenteditable", !readOnly ? "true" : "false");
        editor.view.dom.setAttribute("aria-readonly", readOnly ? "true" : "false");
        if (readOnly) {
          editor.view.dom.classList.add("dm-readonly-mode");
        } else {
          editor.view.dom.classList.remove("dm-readonly-mode");
        }
      }
    }
  }, [readOnly, editor]);

  // Intercept all keystrokes, input events, paste, and drop in read-only mode to prevent any characters from being entered
  useEffect(() => {
    if (!editor?.view?.dom || !readOnly) return;

    const dom = editor.view.dom;

    const handleBeforeInput = (e) => {
      e.preventDefault();
      e.stopPropagation();
      notifyReadOnly();
      return false;
    };

    const handleKeyDown = (e) => {
      // Allow navigation and copy
      const isAllowedKey =
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "PageUp" ||
        e.key === "PageDown" ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "a"));

      if (!isAllowedKey) {
        e.preventDefault();
        e.stopPropagation();
        notifyReadOnly();
        return false;
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      notifyReadOnly();
      return false;
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      notifyReadOnly();
      return false;
    };

    dom.addEventListener("beforeinput", handleBeforeInput, true);
    dom.addEventListener("keydown", handleKeyDown, true);
    dom.addEventListener("paste", handlePaste, true);
    dom.addEventListener("drop", handleDrop, true);

    return () => {
      dom.removeEventListener("beforeinput", handleBeforeInput, true);
      dom.removeEventListener("keydown", handleKeyDown, true);
      dom.removeEventListener("paste", handlePaste, true);
      dom.removeEventListener("drop", handleDrop, true);
    };
  }, [editor, readOnly, notifyReadOnly]);

  // Hydrate content whenever editor is empty but document content exists in database
  useEffect(() => {
    if (!editor) return;

    const isEditorEmpty = editor.isEmpty || editor.state.doc.textContent.trim() === "";
    const hasSubstantialContent = Boolean(
      content &&
      content !== "<p></p>" &&
      content !== "<p><br></p>" &&
      content !== "" &&
      (typeof content === "object"
        ? Boolean(content.content?.length > 0)
        : content.replace(/<[^>]*>/g, "").trim().length > 0 ||
          content.includes("<h") ||
          content.includes("<img") ||
          content.includes("<ul") ||
          content.includes("<ol") ||
          content.includes("<blockquote") ||
          content.includes("<table") ||
          content.includes("<pre"))
    );

    if (isEditorEmpty && hasSubstantialContent) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    const handleScroll = () => {
      if (selectionBox) {
        setSelectionBox(null);
      }
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [selectionBox]);

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

  useEffect(() => {
    if (activeComposer) {
      setTimeout(() => composerInputRef.current?.focus(), 80);
    }
  }, [activeComposer]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key?.toLowerCase() === "m") {
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
      } else if (readOnlyRef.current) {
        // If active element is an input or textarea inside comment composer, allow typing
        if (
          document.activeElement &&
          (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") &&
          composerRef.current?.contains(document.activeElement)
        ) {
          return;
        }

        const isCopyOrSelectAll =
          (e.ctrlKey || e.metaKey) && ["c", "a"].includes(e.key?.toLowerCase());
        const isModifierKeyOnly = ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key);
        const isNavKey =
          e.key?.startsWith("Arrow") ||
          ["Home", "End", "PageUp", "PageDown", "Tab", "Escape"].includes(e.key);

        if (!isCopyOrSelectAll && !isModifierKeyOnly && !isNavKey) {
          e.preventDefault();
          e.stopPropagation();
          notifyReadOnly();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [editor, notifyReadOnly]);

  return (
    <div
      className="relative w-full min-h-[calc(100vh-140px)] px-4 sm:px-8 md:px-12 lg:px-20 py-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (readOnly) {
          notifyReadOnly();
        }
      }}
    >
      <div
        ref={containerRef}
        className="relative dm-editor dm-notion-mode max-w-4xl mx-auto focus:outline-none"
      >
        <div ref={editorRef} className="relative" />

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
            {!readOnly && (
              <>
                <DomternalBubbleMenu editor={editor} />
                <DomternalFloatingMenu editor={editor} requireExplicitTrigger />
                <DomternalNotionColorPicker editor={editor} />
              </>
            )}

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
