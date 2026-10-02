import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { socket } from "@/socket/config/socket.config";
import { setSaveStatus } from "../../states/document.slice";
import { cn } from "@/lib/utils";

export default function DocumentTitleInput({
  documentId,
  initialTitle,
  canEdit = true,
  onUpdateMetadata,
}) {
  const dispatch = useDispatch();
  const [customTitle, setCustomTitle] = useState(null);
  const titleTimerRef = useRef(null);
  const lastReadOnlyToastRef = useRef(0);

  const notifyReadOnly = useCallback(() => {
    const now = Date.now();
    if (now - lastReadOnlyToastRef.current > 1200) {
      lastReadOnlyToastRef.current = now;
      toast.error("You have view-only access. You cannot edit this document.");
    }
  }, []);

  // Synchronize when documentId changes
  useEffect(() => {
    setCustomTitle(null);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
  }, [documentId]);

  // Listen for remote title updates
  useEffect(() => {
    if (!socket || !documentId) return;

    const handleRemoteTitle = ({ documentId: remoteDocId, title: remoteTitle }) => {
      if (remoteDocId === documentId && remoteTitle !== undefined) {
        setCustomTitle(remoteTitle);
      }
    };

    socket.on("doc:title:updated", handleRemoteTitle);
    return () => {
      socket.off("doc:title:updated", handleRemoteTitle);
    };
  }, [documentId]);

  const displayTitle = customTitle ?? (initialTitle || "Untitled");

  const handleTitleChange = (e) => {
    if (!canEdit) {
      notifyReadOnly();
      return;
    }
    const newTitle = e.target.value;
    setCustomTitle(newTitle);
    dispatch(setSaveStatus("saving"));

    if (socket && documentId) {
      socket.emit("doc:title:update", { documentId, title: newTitle });
    }

    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      try {
        if (onUpdateMetadata) {
          await onUpdateMetadata({ title: newTitle.trim() || "Untitled" });
        }
        dispatch(setSaveStatus("saved"));
        setCustomTitle(null);
      } catch (err) {
        console.error("Error saving title:", err);
        dispatch(setSaveStatus("error"));
      }
    }, 500);
  };

  const handleTitleBlur = async () => {
    if (!canEdit) return;
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    const finalTitle = (customTitle ?? displayTitle).trim() || "Untitled";
    if (customTitle !== null && customTitle.trim() !== (initialTitle || "Untitled")) {
      try {
        dispatch(setSaveStatus("saving"));
        if (onUpdateMetadata) {
          await onUpdateMetadata({ title: finalTitle });
        }
        dispatch(setSaveStatus("saved"));
        setCustomTitle(null);
      } catch (err) {
        console.error("Error saving title on blur:", err);
        dispatch(setSaveStatus("error"));
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (!canEdit) {
      const isCopyOrSelectAll =
        (e.ctrlKey || e.metaKey) && ["c", "a"].includes(e.key?.toLowerCase());
      const isNavOrModifier =
        ["Tab", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "Shift", "Control", "Alt", "Meta"].includes(e.key);

      if (!isCopyOrSelectAll && !isNavOrModifier) {
        e.preventDefault();
        notifyReadOnly();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const editorEl = document.querySelector(".dm-editor .ProseMirror");
      if (editorEl) {
        editorEl.focus();
      }
    }
  };

  if (!canEdit) {
    return (
      <h1
        onClick={notifyReadOnly}
        tabIndex={0}
        onKeyDown={handleTitleKeyDown}
        title="You have view-only access to this document"
        className={cn(
          "relative z-10 w-full text-4xl sm:text-5xl font-heading font-extrabold text-foreground bg-transparent border-none focus:outline-none tracking-tight cursor-default select-text py-1"
        )}
      >
        {displayTitle || "Untitled"}
      </h1>
    );
  }

  return (
    <input
      type="text"
      value={displayTitle}
      onChange={handleTitleChange}
      onBlur={handleTitleBlur}
      onKeyDown={handleTitleKeyDown}
      onFocus={(e) => {
        if (displayTitle === "Untitled") {
          e.target.select();
        }
      }}
      placeholder="Untitled"
      className={cn(
        "relative z-10 w-full text-4xl sm:text-5xl font-heading font-extrabold text-foreground bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/30 tracking-tight"
      )}
    />
  );
}
