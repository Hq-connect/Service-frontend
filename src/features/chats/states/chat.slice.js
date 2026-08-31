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

    setUserOnline: (state, action) => {
      const userId = action.payload;

      state.onlineUsers[userId] = true;
    },

    setUserOffline: (state, action) => {
      const userId = action.payload;

      state.onlineUsers[userId] = false;
    },

    setTypingUsers: (state, action) => {
      const { chatId, users } = action.payload;

      state.typingUsers[chatId] = users;
    },
  },
});

export const {
  setActiveChat,
  setReplyingTo,
  clearReplyingTo,
  setSocketStatus,
  setUserOnline,
  setUserOffline,
  setTypingUsers,
} = chatSlice.actions;

export default chatSlice.reducer;