import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/socket/config/socket.config";
import { documentKeys } from "../queries/document.keys";

/**
 * Listens for real-time document title and metadata updates from other collaborators
 * and synchronizes local state & TanStack Query cache.
 */
export function useDocumentRealtimeSync({
  documentId,
  setCustomTitle,
  setCustomIcon,
  setCustomCover,
}) {
  const queryClient = useQueryClient();

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
  }, [documentId, queryClient, setCustomTitle, setCustomIcon, setCustomCover]);
}

export default useDocumentRealtimeSync;
