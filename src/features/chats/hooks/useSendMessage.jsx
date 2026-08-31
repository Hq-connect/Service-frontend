import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import dmService from "../services/dm.service";
import { chatKeys } from "../queries/chat.keys";

export const useSendMessage = (type="dm") => {
    const queryClient = useQueryClient();

    const sendMessage = async ({ chatId, recieverId, content , replyTo=null }) => {
        switch(type){
            case "dm":
                return dmService.sendMessage(chatId, recieverId, content , replyTo);
            default:
                throw new Error(`Unknown chat type: ${type}`);
        }
    }

    return useMutation({
        mutationFn: sendMessage,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: chatKeys.messages(
                    type,
                    variables.chatId
                ),
            });

            queryClient.invalidateQueries({
                queryKey: chatKeys.list(type),
            });
        },
    });
}