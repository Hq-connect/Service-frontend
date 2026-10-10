import api from "@/api/api";

export const calendarService = {
    // Unified calendar feed (meetings + recurring occurrences + events + notes)
    getCalendarFeed: async ({ startDate, endDate, timezone } = {}) => {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (timezone) params.timezone = timezone;

        const response = await api.get("/meetings/calendar", { params });
        return response.data?.data || response.data;
    },

    // Date Notes
    getDateNotes: async (params = {}) => {
        const response = await api.get("/meetings/calendar/notes", { params });
        return response.data?.data?.notes || response.data?.notes || [];
    },

    getDateNote: async (date) => {
        const response = await api.get(`/meetings/calendar/notes/${date}`);
        return response.data?.data?.note || response.data?.note || null;
    },

    saveDateNote: async (date, data) => {
        const response = await api.put(`/meetings/calendar/notes/${date}`, data);
        return response.data?.data?.note || response.data?.note;
    },

    deleteDateNote: async (date) => {
        const response = await api.delete(`/meetings/calendar/notes/${date}`);
        return response.data;
    },

    // Important Events
    getEvents: async (params = {}) => {
        const response = await api.get("/meetings/calendar/events", { params });
        return response.data?.data?.events || response.data?.events || [];
    },

    createEvent: async (data) => {
        const response = await api.post("/meetings/calendar/events", data);
        return response.data?.data?.event || response.data?.event;
    },

    getEventById: async (id) => {
        const response = await api.get(`/meetings/calendar/events/${id}`);
        return response.data?.data?.event || response.data?.event;
    },

    updateEvent: async (id, data) => {
        const response = await api.patch(`/meetings/calendar/events/${id}`, data);
        return response.data?.data?.event || response.data?.event;
    },

    deleteEvent: async (id) => {
        const response = await api.delete(`/meetings/calendar/events/${id}`);
        return response.data;
    },
};

export default calendarService;
