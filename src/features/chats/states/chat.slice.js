import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    activeChatId: null,
    replyingTo: null,

    socketStatus: "disconnected",

    typingUsers: {},
    onlineUsers: {},
};

const chatSlice = createSlice({
    name: "chat",

    initialState,

    reducers: {
        setActiveChat: (state, action) => {
            state.activeChatId = action.payload;
        },

        setReplyingTo: (state, action) => {
            state.replyingTo = action.payload;
        },

        clearReplyingTo: (state) => {
            state.replyingTo = null;
        },

        setSocketStatus: (state, action) => {
            state.socketStatus = action.payload;
        },

        setOnlineUsers: (state, action) => {
            const userIds = Array.isArray(action.payload) ? action.payload : [];
            const newOnline = {};
            userIds.forEach((id) => {
                if (id) {
                    newOnline[String(id)] = true;
                }
            });
            state.onlineUsers = newOnline;
        },

        setUserOnline: (state, action) => {
            const raw = action.payload;
            const uid = (raw && typeof raw === "object") ? (raw.userId || raw._id || raw.id) : raw;
            if (uid) {
                state.onlineUsers[String(uid)] = true;
            }
        },

        setUserOffline: (state, action) => {
            const raw = action.payload;
            const uid = (raw && typeof raw === "object") ? (raw.userId || raw._id || raw.id) : raw;
            if (uid) {
                state.onlineUsers[String(uid)] = false;
            }
        },

        addTypingUser: (state, action) => {
            const { chatId, userId } = action.payload;

            if (!state.typingUsers[chatId]) {
                state.typingUsers[chatId] = [];
            }

            if (!state.typingUsers[chatId].includes(userId)) {
                state.typingUsers[chatId].push(userId);
            }
        },

        removeTypingUser: (state, action) => {
            const { chatId, userId } = action.payload;

            if (!state.typingUsers[chatId]) return;

            state.typingUsers[chatId] =
                state.typingUsers[chatId].filter(
                    (id) => id !== userId
                );
        },
    },
});

export const {
    setActiveChat,
    setReplyingTo,
    clearReplyingTo,

    setSocketStatus,

    setOnlineUsers,
    setUserOnline,
    setUserOffline,

    addTypingUser,
    removeTypingUser,
} = chatSlice.actions;

export default chatSlice.reducer;