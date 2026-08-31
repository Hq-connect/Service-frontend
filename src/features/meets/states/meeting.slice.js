import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    meetings: [],
    currentMeeting: null,
    participants: [],
    messages: [],
    loading: false,
    roomLoading: false,
    error: null,
    createDialogOpen: false,
};

const meetingSlice = createSlice({
    name: "meetings",
    initialState,
    reducers: {
        setMeetings: (state, action) => {
            state.meetings = action.payload;
        },
        setCurrentMeeting: (state, action) => {
            state.currentMeeting = action.payload;
        },
        setParticipants: (state, action) => {
            state.participants = action.payload;
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        appendMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setRoomLoading: (state, action) => {
            state.roomLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setCreateDialogOpen: (state, action) => {
            state.createDialogOpen = action.payload;
        },
        clearMeeting: (state) => {
            state.currentMeeting = null;
            state.participants = [];
            state.messages = [];
            state.roomLoading = false;
            state.error = null;
        },
    },
});

export const {
    setMeetings,
    setCurrentMeeting,
    setParticipants,
    setMessages,
    appendMessage,
    setLoading,
    setRoomLoading,
    setError,
    setCreateDialogOpen,
    clearMeeting,
} = meetingSlice.actions;

export default meetingSlice.reducer;
