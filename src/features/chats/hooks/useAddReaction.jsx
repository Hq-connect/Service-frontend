import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import dmService from "../services/dm.service";
import groupService from "../services/group.service";
import { chatKeys } from "../queries/chat.keys";

export const useAddReaction = (type="dm") => {
    const queryClient = useQueryClient();
    const addReaction = async ({
        messageId,
        emoji,
    }) => {
        switch (type) {
        case "dm":
            return dmService.addReaction(
                messageId,
                emoji
            );

        case "group":
            return groupService.addReaction(
                messageId,
                emoji
            );

        default:
            throw new Error(
                `Unsupported chat type: ${type}`
            );
        }
    };

    return useMutation({
        mutationFn: addReaction,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.all,
            });
        },
    });
}