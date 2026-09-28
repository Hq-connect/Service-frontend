import { useEffect, useState, useCallback, useRef } from "react";
import { socket } from "@/socket/config/socket.config";
import useAuth from "@/features/auth/hooks/useAuth";

/**
 * Hook to manage real-time collaborative editing session for a document
 * @param {string} documentId
 * @param {object} options
 * @param {Function} [options.onRemoteUpdate] - Called when another collaborator emits changes
 */
export const useDocumentSync = (documentId, { onRemoteUpdate } = {}) => {
  const { user } = useAuth();
  const [activePeers, setActivePeers] = useState([]);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);

  useEffect(() => {
    onRemoteUpdateRef.current = onRemoteUpdate;
  }, [onRemoteUpdate]);

  useEffect(() => {
    if (!documentId || !socket) return;

    // Join the document collaboration room
    socket.emit("doc:join", { documentId });

    // Handle peer joined
    const handlePeerJoined = (peer) => {
      setActivePeers((prev) => {
        if (prev.some((p) => p.socketId === peer.socketId)) return prev;
        return [...prev, peer];
      });
    };

    // Handle peer left
    const handlePeerLeft = ({ socketId }) => {
      setActivePeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    // Handle incoming peer updates (ProseMirror / Domternal / CRDT update)
    const handleRemoteUpdate = (payload) => {
      if (onRemoteUpdateRef.current) {
        onRemoteUpdateRef.current(payload);
      }
    };

    // Handle collaborator cursor / awareness
    const handleAwareness = (awarenessData) => {
      setActivePeers((prev) => {
        const existingIdx = prev.findIndex((p) => p.clientId === awarenessData.clientId || p.userId === awarenessData.userId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...awarenessData, lastSeen: Date.now() };
          return updated;
        }
        return [...prev, { ...awarenessData, lastSeen: Date.now() }];
      });
    };

    socket.on("doc:peer:joined", handlePeerJoined);
    socket.on("doc:peer:left", handlePeerLeft);
    socket.on("doc:update", handleRemoteUpdate);
    socket.on("doc:awareness", handleAwareness);

    return () => {
      socket.emit("doc:leave", { documentId });
      socket.off("doc:peer:joined", handlePeerJoined);
      socket.off("doc:peer:left", handlePeerLeft);
      socket.off("doc:update", handleRemoteUpdate);
      socket.off("doc:awareness", handleAwareness);
      setActivePeers([]);
    };
  }, [documentId]);

  // Broadcast editor content change
  const sendUpdate = useCallback(
    (content, update = null) => {
      if (!documentId || !socket) return;
      socket.emit("doc:update", {
        documentId,
        content,
        update,
      });
    },
    [documentId]
  );

  // Broadcast cursor and selection presence
  const sendAwareness = useCallback(
    (cursor) => {
      if (!documentId || !socket) return;
      socket.emit("doc:awareness", {
        documentId,
        cursor,
        user: {
          _id: user?._id || user?.id,
          name: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.name || "Collaborator",
          avatar: user?.avatar,
          color: user?.color,
        },
      });
    },
    [documentId, user]
  );

  return {
    activePeers,
    sendUpdate,
    sendAwareness,
  };
};

export default useDocumentSync;
