import React, { useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import "../styles/editor.css";

/**
 * Pure Read-Only HTML Viewer for documents when user has view-only access.
 * Renders static HTML with the identical Notion typography styling without
 * any contenteditable or editor engine, completely preventing character inputs.
 */
export default function DocumentReadOnlyViewer({
  content = "",
  comments = [],
  currentUserId,
  currentUserName,
  currentUserProfile,
}) {
  const containerRef = useRef(null);
  const lastToastRef = useRef(0);

  const notifyReadOnly = useCallback(() => {
    const now = Date.now();
    if (now - lastToastRef.current > 1200) {
      lastToastRef.current = now;
      toast.error("You have view-only access. You cannot edit this document.");
    }
  }, []);

  // Intercept any typing attempts on the page when in view mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCopyOrSelectAll =
        (e.ctrlKey || e.metaKey) && ["c", "a"].includes(e.key?.toLowerCase());
      const isModifierKeyOnly = ["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key);
      const isNavKey =
        e.key?.startsWith("Arrow") ||
        ["Home", "End", "PageUp", "PageDown", "Tab", "Escape"].includes(e.key);

      if (!isCopyOrSelectAll && !isModifierKeyOnly && !isNavKey) {
        e.preventDefault();
        notifyReadOnly();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [notifyReadOnly]);

  const rawHtml = typeof content === "string" ? content : content?.html || "";
  const hasContent = Boolean(rawHtml && rawHtml.replace(/<[^>]*>/g, "").trim().length > 0);

  return (
    <div
      className="relative w-full min-h-[calc(100vh-140px)] px-4 sm:px-8 md:px-12 lg:px-20 py-6 select-text cursor-default"
      onClick={notifyReadOnly}
    >
      <div
        ref={containerRef}
        className="relative dm-editor dm-notion-mode max-w-4xl mx-auto focus:outline-none"
      >
        <div className="ProseMirror dm-readonly-mode">
          {hasContent ? (
            <div
              dangerouslySetInnerHTML={{ __html: rawHtml }}
              className="outline-none"
            />
          ) : (
            <p className="text-muted-foreground/60 italic text-sm py-4">
              This document has no content yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
