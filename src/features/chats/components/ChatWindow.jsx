import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useGroupMembers } from "../hooks/useGroupMembers";
import { useChatSocket } from "../hooks/useChatSocket";

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
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for message deletion confirmation Dialog
  const [messageToDelete, setMessageToDelete] = React.useState(null);

  // Group members lookup (enabled only for group chats)
  const { data: groupMembers = [] } = useGroupMembers(chatType === "group" ? chatId : null);

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

  // Real-time socket room join/leave and typing status
  const { emitTyping, stopTyping, typingUserNames } = useChatSocket({
    chatId,
    chatType,
    currentUserId,
    otherUser: chat?.otherUser,
    groupMembers,
  });

  if (!chatId || !chat) {
    return (
      <div className="hidden md:flex flex-col flex-1 min-w-0 min-h-0 bg-background">
        <EmptyChat />
      </div>
    );
  }

  const handleSend = ({ text, attachments = [], replyTo: replyToId, linkPreview = null }) => {
    stopTyping();
    const isNew = chatId?.startsWith("new-");
    let contentPayload = text;
    if (attachments.length > 0 || linkPreview) {
      contentPayload = {
        text: text || null,
        attachments: attachments || [],
        ...(linkPreview && { linkPreview }),
      };
    }

    sendMessage(
      {
        chatId: isNew ? null : chatId,
        content: contentPayload,
        replyTo: replyToId,
        ...(chatType === "dm" && { recieverId: chat.otherUser?.userId }),
      },
      {
        onSuccess: (data) => {
          if (isNew && data?.chatId) {
            navigate(`/chats/dm/${data.chatId}`, { replace: true });
          }
        },
      }
    );
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
    setMessageToDelete(message);
  };

  const handleReact = (messageId, emoji) => {
    addReaction({ messageId, emoji });
  };

  return (
    <div className={`flex-col flex-1 min-w-0 min-h-0 bg-background relative ${
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
          groupMembers={groupMembers}
          typingUsers={typingUserNames}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReact={handleReact}
        />
      </div>

      {/* Input - receives replyingTo from Redux and typing listeners */}
      <MessageInput
        onSend={handleSend}
        replyTo={replyingTo}
        onCancelReply={handleCancelReply}
        onTyping={emitTyping}
        onStopTyping={stopTyping}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!messageToDelete} onOpenChange={(open) => { if (!open) setMessageToDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete message?</DialogTitle>
            <DialogDescription>
              This message will be deleted for everyone in this chat. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMessageToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (messageToDelete) {
                  deleteMessage(messageToDelete._id);
                  setMessageToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChatWindow;
