import api from "@/api/api";

const groupService = {
    createGroup: async (name, description, members) => {
        const payload = {
            name,
            description,
            userIds:members,
        };
        const response = await api.post("/chats/group", payload);
        return response.data.data.groupChat;
    },
    getGroups: async () => {
        const response = await api.get("/chats/group");
        return response.data.data.groups;
    },
    updateGroupName: async (chatId, name) => {
        const response = await api.put("/chats/group/name", {
            chatId,
            name,
        });
        return response.data.data.groupChat;
    },
    updateGroupDescription: async (chatId, description) => {
        const response = await api.put("/chats/group/description", {
            chatId,
            description,
        });
        return response.data.data.groupChat;
    },
    addInGroup: async (chatId, userIds) => {
        const response = await api.post("/chats/group/member", {
            chatId,
            userIds,
        });
        return response.data.data.groupChat;
    },
    leaveGroup: async (chatId) => {
        const response = await api.delete("/chats/group/member", {
            data: {
                chatId,
            },
        });
        return response.data.data.groupChat;
    },
    sendMessage: async (chatId, content, replyTo=null) => {
        const formattedContent = typeof content === "object" && content !== null ? content : { text: content };
        const payload = {
            chatId,
            content: formattedContent,
            replyTo,
        };
        const response = await api.post("/chats/group/message", payload);
        return response.data.data.message;
    },
    getGroupMembers: async (chatId) => {
        const response = await api.get("/chats/group/members", {
            params: {
                chatId,
            },
        });
        return response.data.data.members;
    },
    getGroupMessages: async (chatId, limit, before) => {
        const response = await api.get("/chats/group/messages", {
            params: {
                chatId,
                limit,
                before,
            },
        });
        return response.data.data.messages;
    },
    updateMessage: async (messageId, text) => {
        const response = await api.put("/chats/group/message", {
            messageId,
            content: { text },
        });
        return response.data.data.message;
    },
    deleteMessage: async (messageId) => {
        const response = await api.delete("/chats/group/message", {
            data: {
                messageId,
            },
        });
        return response.data.data.message;
    },
    addReaction: async (messageId, emoji) => {
        const response = await api.post("/chats/group/message/reaction", {
            messageId,
            emoji,
        });
        return response.data.data.message;
    },
}

export default groupService;