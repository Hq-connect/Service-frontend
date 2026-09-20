import { useMutation, useQueryClient } from "@tanstack/react-query";
import chatService from "../services/chat.service";
import { chatKeys } from "../queries/chat.keys";

/**
 * Mutation hook for marking a chat conversation as read
 * Optimistically zeroes out the unread count in both list and unread summary caches.
 */
export const useMarkChatRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ chatId, messageId = null }) =>
            chatService.markChatAsRead({ chatId, messageId }),

        onMutate: async ({ chatId }) => {
            if (!chatId || chatId.startsWith("new-")) return;

            // 1. Cancel ongoing queries for unread summary
            await queryClient.cancelQueries({ queryKey: chatKeys.unread() });

            // Snapshot previous unread summary
            const previousUnread = queryClient.getQueryData(chatKeys.unread());
            const prevChatUnread = previousUnread?.byChat?.[chatId] || 0;

            // 2. Optimistically update unread summary
            if (previousUnread && prevChatUnread > 0) {
                queryClient.setQueryData(chatKeys.unread(), (old) => {
                    if (!old) return old;
                    const byChat = { ...(old.byChat || {}) };
                    delete byChat[chatId];

                    return {
                        ...old,
                        total: Math.max(0, (old.total || 0) - prevChatUnread),
                        dm: Math.max(0, (old.dm || 0) - prevChatUnread),
                        group: Math.max(0, (old.group || 0) - prevChatUnread),
                        byChat,
                    };
                });
            }

            // 3. Optimistically update DM list
            queryClient.setQueryData(chatKeys.list("dm"), (oldChats) => {
                if (!oldChats || !Array.isArray(oldChats)) return oldChats;
                return oldChats.map((chat) => {
                    if (chat.chatId === chatId || chat._id === chatId) {
                        return { ...chat, unreadCount: 0 };
                    }
                    return chat;
                });
            });

            // 4. Optimistically update Group list
            queryClient.setQueryData(chatKeys.list("group"), (oldChats) => {
                if (!oldChats || !Array.isArray(oldChats)) return oldChats;
                return oldChats.map((chat) => {
                    const cId = chat.chatId || chat._id;
                    if (cId === chatId) {
                        return { ...chat, unreadCount: 0 };
                    }
                    return chat;
                });
            });

            return { previousUnread };
        },

        onError: (err, variables, context) => {
            if (context?.previousUnread) {
                queryClient.setQueryData(chatKeys.unread(), context.previousUnread);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.unread() });
        },
    });
};

export default useMarkChatRead;
