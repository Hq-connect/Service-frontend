import { useMutation, useQueryClient } from "@tanstack/react-query";
import dmService from "../services/dm.service";
import { chatKeys } from "../queries/chat.keys";
import groupService from "../services/group.service";
import channelService from "../services/channel.service";

export const useDeleteMessage = (type="dm") => {
    const queryClient = useQueryClient();

    const deleteMessage = async (messageId) => {
        switch (type) {
        case "dm":
            return dmService.deleteMessage(
                messageId
            );

        case "group":
            return groupService.deleteMessage(
                messageId
            );

        case "channel":
            return channelService.deleteMessage(
                messageId
            );

        default:
            throw new Error(
            `Unsupported chat type: ${type}`
            );
        }
    };

    return useMutation({
        mutationFn: deleteMessage,

        onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: chatKeys.all,
        });
        },
    });
}