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
import {
  useChannelDetails,
  useJoinChannel,
  usePinChannelMessage,
} from "../hooks/useChannelActions";
import useAuth from "@/features/auth/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, Megaphone, Hash, Loader2 } from "lucide-react";

import { useGroupMembers } from "../hooks/useGroupMembers";
import { useChatSocket } from "../hooks/useChatSocket";
import { useMarkChatRead } from "../hooks/useMarkChatRead";
import { extractUser } from "@/global/utils/user";

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

  const isMultiMember = chatType === "group" || chatType === "channel";

  // Group / Channel members lookup
  const { data: groupMembers = [] } = useGroupMembers(
    isMultiMember ? chatId : null,
    chatType
  );

  // Channel details lookup (for pinnedMessages, isArchived, postingPermission, isJoined)
  const { data: channelDetails } = useChannelDetails(
    chatId,
    chatType === "channel"
  );

  const resolvedChat =
    chatType === "channel" && channelDetails
      ? { ...chat, ...channelDetails }
      : chat;

  // Global state from chat.slice
  const replyingTo = useSelector((state) => state.chat.replyingTo);
  const { mutate: sendMessage } = useSendMessage(chatType);
  const { mutate: updateMessage } = useUpdateMessage(chatType);
  const { mutate: deleteMessage } = useDeleteMessage(chatType);
  const { mutate: addReaction } = useAddReaction(chatType);
  const { mutate: markChatRead } = useMarkChatRead();
  const { mutate: pinMessage } = usePinChannelMessage();
  const { mutate: joinChannel, isPending: isJoiningChannel } = useJoinChannel();

  // Sync activeChatId into Redux whenever chatId changes, and clear on unmount
  React.useEffect(() => {
    dispatch(setActiveChat(chatId ?? null));
    return () => {
      dispatch(setActiveChat(null));
    };
  }, [chatId, dispatch]);

  // Mark chat as read when opening conversation or switching chats
  React.useEffect(() => {
    if (chatId && !chatId.startsWith("new-")) {
      markChatRead({ chatId, messageId: resolvedChat?.lastMessage?._id || null });
    }
  }, [chatId, markChatRead]);

  // Mark chat as read when tab regains focus
  React.useEffect(() => {
    const handleFocus = () => {
      if (chatId && !chatId.startsWith("new-")) {
        markChatRead({ chatId, messageId: resolvedChat?.lastMessage?._id || null });
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [chatId, resolvedChat?.lastMessage?._id, markChatRead]);

  // Extract current user id
  const currentUser = extractUser(user);
  const currentUserId = currentUser?._id ?? currentUser?.id;

  // Real-time socket room join/leave and typing status
  const { emitTyping, stopTyping, typingUserNames } = useChatSocket({
    chatId,
    chatType,
    currentUserId,
    otherUser: resolvedChat?.otherUser,
    groupMembers,
  });

  if (!chatId || !resolvedChat) {
    return (
      <div className="hidden md:flex flex-col flex-1 min-w-0 min-h-0 bg-background">
        <EmptyChat />
      </div>
    );
  }

  // Channel role & posting checks
  const myParticipant = groupMembers.find((m) => {
    const mId = String(m.userId?._id || m.userId || m._id || "");
    return mId === String(currentUserId || "");
  });
  const myRole = myParticipant?.role || resolvedChat?.myRole || "member";
  const isChannelAdmin =
    chatType === "channel" && (myRole === "owner" || myRole === "admin");

  const isNotJoinedChannel =
    chatType === "channel" && resolvedChat?.isJoined === false && !myParticipant;
  const isArchivedChannel =
    chatType === "channel" && Boolean(resolvedChat?.isArchived);
  const isAdminsOnlyLocked =
    chatType === "channel" &&
    resolvedChat?.postingPermission === "admins_only" &&
    !isChannelAdmin;

  const pinnedMessageIds =
    chatType === "channel" && Array.isArray(resolvedChat?.pinnedMessages)
      ? resolvedChat.pinnedMessages.map((pm) =>
          String(typeof pm === "object" ? pm._id : pm)
        )
      : [];

  const handleSend = ({
    text,
    attachments = [],
    replyTo: replyToId,
    linkPreview = null,
    mentions = [],
    mentionAll = false,
  }) => {
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
        mentions,
        mentionAll,
        ...(chatType === "dm" && { recieverId: resolvedChat.otherUser?.userId }),
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

  const handlePin = (messageId, pinned) => {
    if (chatType === "channel" && chatId) {
      pinMessage({ chatId, messageId, pinned });
    }
  };

  return (
    <div
      className={`flex-col flex-1 min-w-0 min-h-0 bg-background relative ${
        chatId ? "flex" : "hidden md:flex"
      }`}
    >
      {/* Header */}
      <ChatHeader chatType={chatType} chat={resolvedChat} />

      {/* Message area */}
      <div className="flex flex-col flex-1 min-h-0">
        <MessageList
          chatId={chatId}
          chatType={chatType}
          currentUserId={currentUserId}
          otherUser={resolvedChat?.otherUser}
          groupMembers={groupMembers}
          typingUsers={typingUserNames}
          canModerate={isChannelAdmin}
          canPin={isChannelAdmin}
          pinnedMessageIds={pinnedMessageIds}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReact={handleReact}
          onPin={handlePin}
        />
      </div>

      {/* Input or Channel State Banner */}
      {isNotJoinedChannel ? (
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="size-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              You are previewing{" "}
              <span className="font-semibold text-foreground">
                #{resolvedChat.name}
              </span>
              . Join the channel to participate.
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 text-xs shrink-0"
            disabled={isJoiningChannel}
            onClick={() => joinChannel(chatId)}
          >
            {isJoiningChannel && <Loader2 className="size-3 animate-spin mr-1" />}
            Join Channel
          </Button>
        </div>
      ) : isArchivedChannel ? (
        <div className="px-4 py-3 border-t border-border bg-amber-500/10 flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 shrink-0">
          <Archive className="size-4 shrink-0" />
          <span>This channel has been archived. New messages cannot be posted.</span>
        </div>
      ) : isAdminsOnlyLocked ? (
        <div className="px-4 py-3 border-t border-border bg-muted/40 flex items-center justify-center gap-2 text-xs text-muted-foreground shrink-0">
          <Megaphone className="size-4 text-primary shrink-0" />
          <span>Only channel admins and owners can post messages in this channel.</span>
        </div>
      ) : (
        <MessageInput
          onSend={handleSend}
          replyTo={replyingTo}
          onCancelReply={handleCancelReply}
          onTyping={emitTyping}
          onStopTyping={stopTyping}
          chatType={chatType}
          members={groupMembers}
          currentUserId={currentUserId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!messageToDelete}
        onOpenChange={(open) => {
          if (!open) setMessageToDelete(null);
        }}
      >
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
