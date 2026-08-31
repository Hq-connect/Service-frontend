import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setActiveChat, setReplyingTo, clearReplyingTo } from "../states/chat.slice";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import EmptyChat from "./EmptyChat";
import { useSendMessage } from "../hooks/useSendMessage";
import { useUpdateMessage } from "../hooks/useUpdateMessage";
import { useDeleteMessage } from "../hooks/useDeleteMessage";
import { useAddReaction } from "../hooks/useAddReaction";
import useAuth from "@/features/auth/hooks/useAuth";

/**
 * Right panel of the chat layout - header, messages, input.
 * Uses chat.slice for replyingTo and activeChatId instead of local state.
 *
 * @param {string|null} chatId
 * @param {"dm"|"group"|"channel"} chatType
 * @param {object|null} chat - Current chat data object
 */
function ChatWindow({ chatId, chatType, chat }) {
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Global state from chat.slice
  const replyingTo = useSelector((state) => state.chat.replyingTo);
  const { mutate: sendMessage } = useSendMessage(chatType);
  const { mutate: updateMessage } = useUpdateMessage(chatType);
  const { mutate: deleteMessage } = useDeleteMessage(chatType);
  const { mutate: addReaction } = useAddReaction(chatType);

  // Sync activeChatId into Redux whenever chatId changes
  React.useEffect(() => {
    dispatch(setActiveChat(chatId ?? null));
  }, [chatId, dispatch]);

  // Extract current user id
  const extractUser = (u) => {
    if (!u) return null;
    if (u.user && typeof u.user === "object") return u.user;
    if (u.data && typeof u.data === "object") return u.data;
    return u;
  };
  const currentUser = extractUser(user);
  const currentUserId = currentUser?._id ?? currentUser?.id;

  if (!chatId || !chat) {
    return (
      <div className="hidden md:flex flex-col flex-1 min-w-0 min-h-0 bg-background">
        <EmptyChat />
      </div>
    );
  }

  const handleSend = ({ text, replyTo: replyToId }) => {
    sendMessage({
      chatId,
      content: text,
      replyTo: replyToId,
      ...(chatType === "dm" && { recieverId: chat.otherUser?.userId }),
    });
    dispatch(clearReplyingTo());
  };

  const handleReply = (message) => {
    dispatch(setReplyingTo(message));
  };

  const handleCancelReply = () => {
    dispatch(clearReplyingTo());
  };

  const handleEdit = (messageId, newContent) => {
    updateMessage({ messageId, content: newContent });
  };

  const handleDelete = (message) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      deleteMessage(message._id);
    }
  };

  const handleReact = (messageId, emoji) => {
    addReaction({ messageId, emoji });
  };

  return (
    <div className={`flex-col flex-1 min-w-0 min-h-0 bg-background ${
      chatId ? "flex" : "hidden md:flex"
    }`}>
      {/* Header */}
      <ChatHeader chatType={chatType} chat={chat} />

      {/* Message area */}
      <div className="flex flex-col flex-1 min-h-0">
        <MessageList
          chatId={chatId}
          chatType={chatType}
          currentUserId={currentUserId}
          otherUser={chat?.otherUser}
          typingUsers={[]}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReact={handleReact}
        />
      </div>

      {/* Input - receives replyingTo from Redux */}
      <MessageInput
        onSend={handleSend}
        replyTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
}

export default ChatWindow;
