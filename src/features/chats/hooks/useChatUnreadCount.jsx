import { useQuery } from "@tanstack/react-query";
import chatService from "../services/chat.service";
import { chatKeys } from "../queries/chat.keys";

const DEFAULT_UNREAD = {
    total: 0,
    dm: 0,
    group: 0,
    channel: 0,
    byChat: {},
};

/**
 * Hook for fetching and caching unread message counts across all chat categories
 */
export const useChatUnreadCount = (options = {}) => {
    return useQuery({
        queryKey: chatKeys.unread(),
        queryFn: chatService.getUnreadCounts,
        select: (data) => ({
            ...DEFAULT_UNREAD,
            ...(data || {}),
        }),
        staleTime: 0,
        refetchOnWindowFocus: true,
        ...options,
    });
};

export default useChatUnreadCount;
