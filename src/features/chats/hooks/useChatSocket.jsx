import { useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { socket } from "@/socket/config/socket.config";

/**
 * Hook for managing chat room lifecycle (join/leave) and typing broadcasts.
 *
 * @param {object} params
 * @param {string|null} params.chatId - Active chat ID
 * @param {"dm"|"group"|"channel"} [params.chatType="dm"]
 * @param {string|null} params.currentUserId - Logged-in user ID
 * @param {object|null} [params.otherUser] - Other user object in DM
 * @param {Array} [params.groupMembers=[]] - Members array in Group
 */
export const useChatSocket = ({
  chatId,
  chatType = "dm",
  currentUserId,
  otherUser = null,
  groupMembers = [],
}) => {
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const socketStatus = useSelector((state) => state.chat.socketStatus);
  const typingUserIds = useSelector(
    (state) => (chatId ? state.chat.typingUsers[chatId] || [] : [])
  );

  const isValidChat = Boolean(chatId && !chatId.startsWith("new-"));

  // 1. Join room on mount / chatId change / socket reconnection
  useEffect(() => {
    if (!isValidChat) return;

    if (socket.connected) {
      socket.emit("chat:join", chatId);
    }

    const handleReconnect = () => {
      if (isValidChat && socket.connected) {
        socket.emit("chat:join", chatId);
      }
    };

    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);
      if (isValidChat && socket.connected) {
        socket.emit("chat:leave", chatId);
      }
    };
  }, [chatId, isValidChat, socketStatus]);

  // 2. Stop typing when unmounting or switching chats
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (isTypingRef.current && isValidChat && socket.connected) {
        socket.emit("typing:stop", { chatId });
        isTypingRef.current = false;
      }
    };
  }, [chatId, isValidChat]);

  // 3. Emit typing start (with auto stop timer)
  const emitTyping = useCallback(() => {
    if (!isValidChat || !socket.connected) return;

    if (!isTypingRef.current) {
      socket.emit("typing:start", { chatId });
      isTypingRef.current = true;
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current && socket.connected) {
        socket.emit("typing:stop", { chatId });
        isTypingRef.current = false;
      }
    }, 2500);
  }, [chatId, isValidChat]);

  // 4. Force stop typing immediately (e.g. upon sending a message or input blur)
  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    if (isTypingRef.current && isValidChat && socket.connected) {
      socket.emit("typing:stop", { chatId });
      isTypingRef.current = false;
    }
  }, [chatId, isValidChat]);

  // 5. Map typing user IDs into readable display names
  const typingUserNames = useMemo(() => {
    if (!typingUserIds.length) return [];

    const otherTypingIds = typingUserIds.filter((id) => id !== currentUserId);
    if (!otherTypingIds.length) return [];

    if (chatType === "dm") {
      const otherId = otherUser?.userId || otherUser?._id || otherUser?.id;
      if (otherTypingIds.some((id) => id === otherId)) {
        return [otherUser?.name || "User"];
      }
      return ["Someone"];
    }

    if (chatType === "group") {
      return otherTypingIds.map((id) => {
        const found = groupMembers.find(
          (m) =>
            m.userId === id ||
            m._id === id ||
            m.id === id ||
            m.userSnapshot?._id === id
        );
        return (
          found?.userSnapshot?.name ||
          found?.name ||
          found?.email ||
          "Someone"
        );
      });
    }

    return ["Someone"];
  }, [typingUserIds, currentUserId, chatType, otherUser, groupMembers]);

  return {
    emitTyping,
    stopTyping,
    typingUserNames,
  };
};

export default useChatSocket;
