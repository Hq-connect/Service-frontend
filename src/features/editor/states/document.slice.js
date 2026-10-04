import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeDocumentId: null,
  isCollabReady: false,
  saveStatus: "saved", // "saved" | "saving" | "error"
};

const documentSlice = createSlice({
  name: "document",
  initialState,
  reducers: {
    setActiveDocumentId: (state, action) => {
      state.activeDocumentId = action.payload;
      state.isCollabReady = false;
      state.saveStatus = "saved";
    },
    clearActiveDocumentId: (state) => {
      state.activeDocumentId = null;
      state.isCollabReady = false;
      state.saveStatus = "saved";
    },
    setIsCollabReady: (state, action) => {
      state.isCollabReady = action.payload;
    },
    setSaveStatus: (state, action) => {
      state.saveStatus = action.payload;
    },
  },
});

export const {
  setActiveDocumentId,
  clearActiveDocumentId,
  setIsCollabReady,
  setSaveStatus,
} = documentSlice.actions;

export default documentSlice.reducer;
