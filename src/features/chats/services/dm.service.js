import api from "@/api/api";

const dmService = {
    getDms: async () => {
        const response = await api.get("/chats/dm");
        return response.data.data.dms;
    },
    sendMessage: async (chatId, recieverId, text , replyTo=null) => {
        const response = await api.post("/chats/dm/message", {
            chatId,
            recieverId,
            content: { text },
            replyTo,
        });
        return response.data.data.message;
    },
    getMessages: async (chatId, limit, before) => {
        const response = await api.get("/chats/dm/messages", {
            params: {
                chatId,
                limit,
                before,
            },
        });
        return response.data.data.messages;
    },
    updateMessage: async (messageId, text) => {
        const response = await api.put("/chats/dm/message", {
            messageId,
            content: { text },
        });
        return response.data.data.message;
    },
    deleteMessage: async (messageId) => {
        const response = await api.delete("/chats/dm/message", {
            data: {
                messageId,
            },
        });
        return response.data.data.message;
    },
    addReaction: async (messageId, emoji) => {
        const response = await api.post("/chats/dm/message/reaction", {
            messageId,
            emoji,
        });
        return response.data.data.message;
    },
}

export default dmService;