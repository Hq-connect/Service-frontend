import api from "@/api/api";

export const meetingService = {
    // List user's meetings
    getMyMeetings: async (params) => {
        const response = await api.get("/meetings", { params });
        return response.data;
    },

    // Get a single meeting by ID
    getMeeting: async (meetingId) => {
        const response = await api.get(`/meetings/${meetingId}`);
        return response.data;
    },

    // Create a meeting (scheduled or instant)
    createMeeting: async (data) => {
        const response = await api.post("/meetings", data);
        return response.data;
    },

    // Update meeting details
    updateMeeting: async (meetingId, data) => {
        const response = await api.patch(`/meetings/${meetingId}`, data);
        return response.data;
    },

    // Cancel a meeting
    cancelMeeting: async (meetingId) => {
        const response = await api.post(`/meetings/${meetingId}/cancel`);
        return response.data;
    },

    // Join a meeting using unique join code
    joinMeeting: async (joinCode) => {
        const response = await api.post("/meetings/join", { joinCode });
        return response.data;
    },

    // Leave a meeting
    leaveMeeting: async (meetingId) => {
        const response = await api.post(`/meetings/${meetingId}/leave`);
        return response.data;
    },

    // End a meeting (host only)
    endMeeting: async (meetingId) => {
        const response = await api.post(`/meetings/${meetingId}/end`);
        return response.data;
    },

    // Get participants list for a meeting
    getParticipants: async (meetingId) => {
        const response = await api.get(`/meetings/${meetingId}/participants`);
        return response.data;
    },

    // Invite participant to a meeting
    addParticipant: async (meetingId, userId) => {
        const response = await api.post(`/meetings/${meetingId}/participants`, { userId });
        return response.data;
    },

    // Remove participant from a meeting
    removeParticipant: async (meetingId, userId) => {
        const response = await api.delete(`/meetings/${meetingId}/participants/${userId}`);
        return response.data;
    },

    // Get meeting chat messages (paginated)
    getMessages: async (meetingId, params) => {
        const response = await api.get(`/meetings/${meetingId}/chat`, { params });
        return response.data;
    },

    // Send a message in meeting chat
    sendMessage: async (meetingId, content) => {
        const response = await api.post(`/meetings/${meetingId}/chat`, content);
        return response.data;
    },

    // Start screen sharing
    startScreenShare: async (meetingId) => {
        const response = await api.post(`/meetings/${meetingId}/screen-share/start`);
        return response.data;
    },

    // Stop screen sharing
    stopScreenShare: async (meetingId) => {
        const response = await api.post(`/meetings/${meetingId}/screen-share/stop`);
        return response.data;
    },
};
export default meetingService;
