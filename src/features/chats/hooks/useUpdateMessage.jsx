import { useMutation, useQueryClient } from "@tanstack/react-query";
import dmService from "../services/dm.service";
import { chatKeys } from "../queries/chat.keys";
import groupService from "../services/group.service";
import channelService from "../services/channel.service";

export const useUpdateMessage = (type="dm") =>{
    const queryClient = useQueryClient();

    const updateMessage = async ({
        messageId,
        content,
        mentions,
        mentionAll,
    }) => {
        switch (type) {
        case "dm":
            return dmService.updateMessage(
                messageId,
                content
            );

        case "group":
            return groupService.updateMessage(
                messageId,
                content,
                mentions,
                mentionAll
            );

        case "channel":
            return channelService.updateMessage(
                messageId,
                content,
                mentions,
                mentionAll
            );
        default:
            throw new Error(
                `Unsupported chat type: ${type}`
            );
        }
    };

    return useMutation({
        mutationFn: updateMessage,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.all,
            });
        },
    });
}