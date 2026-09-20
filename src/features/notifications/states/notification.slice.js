import { createSlice } from "@reduxjs/toolkit";

const initialSound = localStorage.getItem("hq_sound_enabled");

const initialState = {
  unreadCount: 0,
  isBellOpen: false,
  soundEnabled: initialSound !== null ? initialSound === "true" : true,
  pushPermission: typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "default",
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, action.payload || 0);
    },
    incrementUnreadCount: (state, action) => {
      const step = action.payload || 1;
      state.unreadCount += step;
    },
    decrementUnreadCount: (state, action) => {
      const step = action.payload || 1;
      state.unreadCount = Math.max(0, state.unreadCount - step);
    },
    setIsBellOpen: (state, action) => {
      state.isBellOpen = action.payload;
    },
    toggleBell: (state) => {
      state.isBellOpen = !state.isBellOpen;
    },
    setSoundEnabled: (state, action) => {
      state.soundEnabled = action.payload;
      localStorage.setItem("hq_sound_enabled", String(action.payload));
    },
    setPushPermission: (state, action) => {
      state.pushPermission = action.payload;
    },
  },
});

export const {
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  setIsBellOpen,
  toggleBell,
  setSoundEnabled,
  setPushPermission,
} = notificationSlice.actions;

export default notificationSlice.reducer;
