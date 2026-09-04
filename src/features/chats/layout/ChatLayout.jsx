import React, { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import { useChats } from "../hooks/useChats";
import { useUsers } from "@/global/hooks/useUsers";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Full-height two-panel chat layout.
 *
 * Route structure:
 *   /chats/dm              -> DM list, no chat open
 *   /chats/dm/:chatId      -> DM list + open conversation
 *   /chats/group           -> Group list, no chat open
 *   /chats/group/:chatId   -> Group list + open conversation
 *   /chats/channel         -> Channel list, no chat open
 *   /chats/channel/:chatId -> Channel list + open conversation
 *
 * @param {"dm"|"group"|"channel"|undefined} chatType - Injected by the route
 */
function ChatLayout({ chatType }) {
  const { chatId } = useParams();
  const location = useLocation();

  // Derive type from URL if not passed as prop (e.g. bare /chats route)
  const resolvedType = chatType ?? location.pathname.split("/")[2] ?? "dm";

  // Fetch chats for the active type to resolve the current chat object
  const { data: chats = [] } = useChats(resolvedType);

  // API uses "chatId" field (not "_id") on the chat document
  const queryClient = useQueryClient();
  const newUserId = chatId?.startsWith("new-") ? chatId.replace("new-", "") : null;
  const { data: tenantUsers = [] } = useUsers({ limit: 100 , status:"active", enabled: !!newUserId });

  const selectedUser = useMemo(() => {
    if (!newUserId) return null;
    const found = tenantUsers.find((u) => u._id === newUserId);
    if (found) return found;

    // Search query cache dynamically if user is not in the active page
    const queries = queryClient.getQueryCache().getAll();
    for (const query of queries) {
      if (query.state.data && Array.isArray(query.state.data)) {
        const u = query.state.data.find((item) => item && item._id === newUserId);
        if (u) return u;
      }
    }
    return null;
  }, [tenantUsers, newUserId, queryClient]);

  const mockChat = useMemo(() => {
    if (!newUserId || !selectedUser) return null;
    return {
      _id: chatId,
      chatId: chatId,
      otherUser: {
        userId: selectedUser._id,
        name: `${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim() || selectedUser.name || selectedUser.email,
        email: selectedUser.email,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        avatar: selectedUser.avatar,
      }
    };
  }, [chatId, newUserId, selectedUser]);

  const activeChat = useMemo(
    () => chats.find((c) => (c.chatId ?? c._id) === chatId) ?? mockChat,
    [chats, chatId, mockChat]
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left: Conversation list */}
      <ChatSidebar activeType={resolvedType} />

      {/* Right: Active chat window */}
      <ChatWindow
        chatId={chatId ?? null}
        chatType={resolvedType}
        chat={activeChat}
      />
    </div>
  );
}

export default ChatLayout;
