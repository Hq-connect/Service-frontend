import { useMutation, useQueryClient } from "@tanstack/react-query";
import dmService from "../services/dm.service";
import { chatKeys } from "../queries/chat.keys";

export const useDeleteMessage = (type="dm") => {
    const queryClient = useQueryClient();

    const deleteMessage = async (messageId) => {
        switch (type) {
        case "dm":
            return dmService.deleteMessage(
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