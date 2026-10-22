import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import meetingService from "@/features/meets/services/meeting.service";
import dmService from "../services/dm.service";
import groupService from "../services/group.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "../queries/chat.keys";

/**
 * Hook to initiate an audio or video call directly from a chat window.
 * Integrates with meeting service for instant room generation and posts
 * a call invite message to the active chat conversation.
 *
 * @param {object} params
 * @param {object} params.chat - Active chat object (DM or Group)
 * @param {"dm"|"group"|"channel"} [params.chatType="dm"]
 */
export const useInitiateCall = ({ chat, chatType = "dm" }) => {
  const [isStartingCall, setIsStartingCall] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initiateCall = useCallback(
    async ({ callType = "audio" } = {}) => {
      const isVideo = callType === "video";
      const otherUser = chat?.otherUser;
      const targetUserId = otherUser?.userId || otherUser?._id || otherUser?.id;
      const targetName = otherUser?.name || "User";
      const groupName = chat?.name || "Group";

      setIsStartingCall(true);
      const loadingToastId = toast.loading(
        isVideo ? "Starting video call..." : "Starting voice call..."
      );

      try {
        const title =
          chatType === "dm"
            ? `${isVideo ? "Video" : "Audio"} Call with ${targetName}`
            : `${isVideo ? "Video" : "Audio"} Call: ${groupName}`;

        let participantIds = [];
        if (chatType === "dm" && targetUserId) {
          participantIds = [String(targetUserId)];
        } else if (chatType === "group" && Array.isArray(chat?.members)) {
          participantIds = chat.members
            .map((m) => m.userId || m._id || m.id)
            .filter(Boolean)
            .map(String);
        }

        // 1. Create instant meeting in meeting service
        const response = await meetingService.createMeeting({
          title,
          type: "instant",
          duration: 60,
          participantIds,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });

        const created = response?.data?.meeting || response?.meeting;
        const joinCode = created?.joinCode;

        if (!joinCode) {
          throw new Error("Unable to create call room. Please try again.");
        }

        // 2. Post a call message to the chat channel / conversation
        const isNew =
          chat?.chatId?.startsWith("new-") || chat?._id?.startsWith("new-");
        const activeChatId = isNew ? null : chat?.chatId || chat?._id;
        const callEmoji = isVideo ? "📹" : "📞";
        const callTypeLabel = isVideo ? "video" : "voice";
        const callMessageText = `${callEmoji} Started a ${callTypeLabel} call • Join room: /meets/room/${joinCode}?callType=${callType}`;

        try {
          if (chatType === "dm") {
            await dmService.sendMessage(activeChatId, targetUserId, callMessageText);
          } else if (chatType === "group" && activeChatId) {
            await groupService.sendMessage(activeChatId, callMessageText);
          }

          // Invalidate messages query cache to immediately display the card
          if (activeChatId) {
            queryClient.invalidateQueries({
              queryKey: chatKeys.messages(chatType, activeChatId),
            });
          }
        } catch (msgErr) {
          console.warn("[useInitiateCall] Failed to post call message to chat:", msgErr);
        }

        toast.dismiss(loadingToastId);
        toast.success(
          isVideo ? "Video call started!" : "Voice call started!"
        );

        // 3. Navigate caller directly to the meeting room with callType parameter
        navigate(`/meets/room/${joinCode}?callType=${callType}`);
      } catch (err) {
        toast.dismiss(loadingToastId);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to initiate call. Please try again.";
        toast.error(errMsg);
      } finally {
        setIsStartingCall(false);
      }
    },
    [chat, chatType, navigate, queryClient]
  );

  return {
    initiateCall,
    isStartingCall,
  };
};

export default useInitiateCall;
