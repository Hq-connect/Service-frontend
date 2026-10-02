import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
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
    if (!canEdit) return;
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
    if (e.key === "Enter") {
      e.preventDefault();
      const editorEl = document.querySelector(".dm-editor .ProseMirror");
      if (editorEl) {
        editorEl.focus();
      }
    }
  };

  return (
    <input
      type="text"
      value={displayTitle}
      onChange={handleTitleChange}
      onBlur={handleTitleBlur}
      onKeyDown={handleTitleKeyDown}
      onFocus={(e) => {
        if (canEdit && displayTitle === "Untitled") {
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
  );
}
