import React, { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import { useChats } from "../hooks/useChats";

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
  const activeChat = useMemo(
    () => chats.find((c) => (c.chatId ?? c._id) === chatId) ?? null,
    [chats, chatId]
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
