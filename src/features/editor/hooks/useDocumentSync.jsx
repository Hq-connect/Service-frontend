import { useEffect, useState, useCallback, useRef } from "react";
import { socket } from "@/socket/config/socket.config";
import useAuth from "@/features/auth/hooks/useAuth";
import { getUserProfile } from "../utils/userProfile";
import { SocketAwarenessProvider } from "../collaboration/SocketAwarenessProvider";

export const useDocumentSync = (documentId) => {
  const { user } = useAuth();
  const [activePeers, setActivePeers] = useState([]);
  const [awareness, setAwareness] = useState(null);
  const [yjsXmlFragment, setYjsXmlFragment] = useState(null);
  const providerRef = useRef(null);

  useEffect(() => {
    if (!documentId || !socket) return;
    const profile = getUserProfile(user);

    const provider = new SocketAwarenessProvider(documentId, socket, profile);
    providerRef.current = provider;
    setAwareness(provider.awareness);
    setYjsXmlFragment(provider.yXmlFragment);

    const handleAwarenessChange = () => {
      const peers = [];
      provider.awareness.getStates().forEach((state, clientID) => {
        if (clientID !== provider.awareness.clientID && state.user) {
          peers.push({
            clientId: clientID,
            userId: state.user._id,
            user: state.user,
          });
        }
      });
      if (peers.length > 0) {
        setActivePeers(peers);
      }
    };

    provider.awareness.on("change", handleAwarenessChange);

    return () => {
      provider.awareness.off("change", handleAwarenessChange);
      provider.destroy();
      providerRef.current = null;
      setAwareness(null);
      setYjsXmlFragment(null);
    };
  }, [documentId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (providerRef.current) {
        providerRef.current.destroy();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (providerRef.current && user) {
      providerRef.current.setUserProfile(getUserProfile(user));
    }
  }, [user]);

  useEffect(() => {
    if (!documentId || !socket) return;

    const profile = getUserProfile(user);
    const currentUserId = profile._id;

    socket.emit("doc:join", {
      documentId,
      user: profile,
    });

    const handlePeersList = ({ peers }) => {
      providerRef.current?.broadcastLocalState();
      if (Array.isArray(peers)) {
        setActivePeers((prev) => {
          const map = new Map();
          for (const p of prev) {
            const key = p.user?._id || p.userId || p.socketId;
            map.set(key, p);
          }
          for (const p of peers) {
            const key = p.user?._id || p.userId || p.socketId;
            if (p.socketId !== socket.id && (currentUserId ? key !== currentUserId : true)) {
              map.set(key, p);
            }
          }
          return Array.from(map.values());
        });
      }
    };

    const handlePeerJoined = (peer) => {
      providerRef.current?.broadcastLocalState();
      const key = peer.user?._id || peer.userId || peer.socketId;
      if (peer.socketId === socket.id || (currentUserId && key === currentUserId)) return;
      setActivePeers((prev) => {
        const map = new Map();
        for (const p of prev) {
          const k = p.user?._id || p.userId || p.socketId;
          map.set(k, p);
        }
        map.set(key, peer);
        return Array.from(map.values());
      });
    };

    const handlePeerLeft = ({ socketId, userId: leftUserId }) => {
      setActivePeers((prev) =>
        prev.filter((p) => {
          if (socketId && p.socketId === socketId) return false;
          if (leftUserId && (p.userId === leftUserId || p.user?._id === leftUserId)) return false;
          return true;
        })
      );
    };

    const handleAwareness = (awarenessData) => {
      if (awarenessData.socketId === socket.id || awarenessData.userId === currentUserId) return;
      setActivePeers((prev) => {
        const key = awarenessData.socketId || awarenessData.clientId || awarenessData.userId;
        const existingIdx = prev.findIndex(
          (p) => (p.socketId || p.clientId || p.userId) === key
        );
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...awarenessData, lastSeen: Date.now() };
          return updated;
        }
        return [...prev, { ...awarenessData, lastSeen: Date.now() }];
      });
    };

    socket.on("doc:peers", handlePeersList);
    socket.on("doc:peer:joined", handlePeerJoined);
    socket.on("doc:peer:left", handlePeerLeft);
    socket.on("doc:awareness", handleAwareness);

    return () => {
      socket.emit("doc:leave", { documentId });
      socket.off("doc:peers", handlePeersList);
      socket.off("doc:peer:joined", handlePeerJoined);
      socket.off("doc:peer:left", handlePeerLeft);
      socket.off("doc:awareness", handleAwareness);
      setActivePeers([]);
    };
  }, [documentId, user]);

  const sendAwareness = useCallback(
    (cursor) => {
      if (!documentId || !socket) return;
      const profile = getUserProfile(user);
      socket.emit("doc:awareness", {
        documentId,
        cursor,
        user: profile,
      });
    },
    [documentId, user]
  );

  const applyServerSnapshot = useCallback((snapshotArray) => {
    providerRef.current?.applyServerSnapshot(snapshotArray);
  }, []);

  const getSnapshot = useCallback(() => {
    return providerRef.current?.getSnapshot() ?? null;
  }, []);

  return {
    activePeers,
    awareness,
    currentUserId: getUserProfile(user)._id,
    sendAwareness,
    yjsXmlFragment,
    applyServerSnapshot,
    getSnapshot,
  };
};

export default useDocumentSync;
