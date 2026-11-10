import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import dmService from "../services/dm.service";
import { chatKeys } from "../queries/chat.keys";
import groupService from "../services/group.service";
import channelService from "../services/channel.service";

export const useSendMessage = (type="dm") => {
    const queryClient = useQueryClient();

    const sendMessage = async ({ chatId, recieverId, content, replyTo = null, mentions = [], mentionAll = false }) => {
        switch(type){
            case "dm":
                return dmService.sendMessage(chatId, recieverId, content, replyTo);
            case "group":
                return groupService.sendMessage(chatId, content, replyTo, mentions, mentionAll);
            case "channel":
                return channelService.sendMessage(chatId, content, replyTo, mentions, mentionAll);
            default:
                throw new Error(`Unknown chat type: ${type}`);
        }
    }

    return useMutation({
        mutationFn: sendMessage,
        onSuccess: (data, variables) => {
            const targetChatId = variables.chatId || data?.chatId;
            if (targetChatId) {
                queryClient.invalidateQueries({
                    queryKey: chatKeys.messages(type, targetChatId),
                });
            }

            queryClient.invalidateQueries({
                queryKey: chatKeys.list(type),
            });
        },
    });
}