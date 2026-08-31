import React from "react";
import ChatLayout from "../layout/ChatLayout";

/**
 * Entry point page for the /chats/* routes.
 * Passes the chatType resolved from the nested route into ChatLayout.
 *
 * @param {"dm"|"group"|"channel"|undefined} chatType - Passed from Router
 */
function ChatPage({ chatType }) {
  return <ChatLayout chatType={chatType} />;
}

export default ChatPage;
