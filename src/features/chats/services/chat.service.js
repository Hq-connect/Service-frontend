import api from "@/api/api";

const chatService = {
    /**
     * Get aggregate unread count summary across all chats
     * @returns {Promise<{ total: number, dm: number, group: number, channel: number, byChat: Record<string, number> }>}
     */
    getUnreadCounts: async () => {
        const response = await api.get("/chats/unread");
        return response.data.data;
    },

    /**
     * Mark a chat as read up to an optional messageId
     * @param {{ chatId: string, messageId?: string|null }} payload
     */
    markChatAsRead: async ({ chatId, messageId = null }) => {
        const response = await api.post("/chats/read", {
            chatId,
            messageId,
        });
        return response.data.data;
    },

    /**
     * Toggle vote on a poll option
     * @param {{ messageId: string, optionIndex: number }} payload
     */
    votePoll: async ({ messageId, optionIndex }) => {
        const response = await api.post("/chats/poll/vote", {
            messageId,
            optionIndex,
        });
        return response.data.data.message;
    },

    /**
     * Close a poll (creator only)
     * @param {{ messageId: string }} payload
     */
    closePoll: async ({ messageId }) => {
        const response = await api.post("/chats/poll/close", {
            messageId,
        });
        return response.data.data.message;
    },
};

export default chatService;
