import api from "@/api/api";

const channelService = {
    getChannels: async () => {
        const response = await api.get("/chats/channel");
        return response.data.data.channels;
    },

    discoverChannels: async (search = "") => {
        const response = await api.get("/chats/channel/discover", {
            params: search ? { search } : {},
        });
        return response.data.data.channels;
    },

    getChannelDetails: async (chatId) => {
        const response = await api.get("/chats/channel/details", {
            params: { chatId },
        });
        return response.data.data.channel;
    },

    createChannel: async ({
        name,
        topic = null,
        description = null,
        visibility = "public",
        postingPermission = "everyone",
        userIds = [],
    }) => {
        const response = await api.post("/chats/channel", {
            name,
            topic,
            description,
            visibility,
            postingPermission,
            userIds,
        });
        return response.data.data.channel;
    },

    updateChannel: async ({
        chatId,
        name,
        topic,
        description,
        visibility,
        postingPermission,
        isArchived,
    }) => {
        const payload = { chatId };
        if (name !== undefined) payload.name = name;
        if (topic !== undefined) payload.topic = topic;
        if (description !== undefined) payload.description = description;
        if (visibility !== undefined) payload.visibility = visibility;
        if (postingPermission !== undefined) payload.postingPermission = postingPermission;
        if (isArchived !== undefined) payload.isArchived = isArchived;

        const response = await api.put("/chats/channel", payload);
        return response.data.data.channel;
    },

    joinChannel: async (chatId) => {
        const response = await api.post("/chats/channel/join", { chatId });
        return response.data.data;
    },

    addInChannel: async (chatId, userIds) => {
        const response = await api.post("/chats/channel/member", {
            chatId,
            userIds,
        });
        return response.data.data.members;
    },

    removeOrLeaveChannel: async (chatId, userId = undefined) => {
        const data = { chatId };
        if (userId) data.userId = userId;
        const response = await api.delete("/chats/channel/member", { data });
        return response.data.data.participant;
    },

    updateMemberRole: async (chatId, userId, role) => {
        const response = await api.put("/chats/channel/member/role", {
            chatId,
            userId,
            role,
        });
        return response.data.data.participant;
    },

    getChannelMembers: async (chatId) => {
        const response = await api.get("/chats/channel/members", {
            params: { chatId },
        });
        return response.data.data.members;
    },

    pinMessage: async (chatId, messageId, pinned = true) => {
        const response = await api.post("/chats/channel/pin", {
            chatId,
            messageId,
            pinned,
        });
        return response.data.data.pinnedMessages;
    },

    sendMessage: async (chatId, content, replyTo = null, mentions = [], mentionAll = false) => {
        const formattedContent =
            typeof content === "object" && content !== null ? content : { text: content };
        const payload = {
            chatId,
            content: formattedContent,
            replyTo,
            mentions,
            mentionAll,
        };
        const response = await api.post("/chats/channel/message", payload);
        return response.data.data.message;
    },

    getChannelMessages: async (chatId, limit, before) => {
        const response = await api.get("/chats/channel/messages", {
            params: {
                chatId,
                limit,
                before,
            },
        });
        return response.data.data.messages;
    },

    updateMessage: async (messageId, text, mentions, mentionAll) => {
        const payload = {
            messageId,
            content: typeof text === "object" && text !== null ? text : { text },
        };
        if (mentions !== undefined) payload.mentions = mentions;
        if (mentionAll !== undefined) payload.mentionAll = mentionAll;

        const response = await api.put("/chats/channel/message", payload);
        return response.data.data.message;
    },

    deleteMessage: async (messageId) => {
        const response = await api.delete("/chats/channel/message", {
            data: {
                messageId,
            },
        });
        return response.data.data.message;
    },

    addReaction: async (messageId, emoji) => {
        const response = await api.post("/chats/channel/message/reaction", {
            messageId,
            emoji,
        });
        return response.data.data.message;
    },
};

export default channelService;

