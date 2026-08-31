import { useInfiniteQuery } from "@tanstack/react-query";
import dmService from "../services/dm.service";
import { chatKeys } from "../queries/chat.keys";

export const useMessages = (type="dm", chatId, limit=30) => {
    const getMessages = async ({ pageParam }) => {
        switch (type) {
        case "dm":
            return dmService.getMessages(
                chatId,
                limit,
                pageParam
            );

        default:
            throw new Error(
                `Unsupported chat type: ${type}`
            );
        }
    };

    return useInfiniteQuery({
        queryKey: chatKeys.messages(
            type,
            chatId
        ),

        queryFn: getMessages,

        initialPageParam: null,

        getNextPageParam: (lastPage) => {
            if (!lastPage?.length) {
                return undefined;
            }

            // Return the timestamp of the oldest message in the current page
            return lastPage[
                lastPage.length - 1
            ].createdAt;
        },

        enabled: !!chatId && !!type && !chatId.startsWith("new-"),
    });
}