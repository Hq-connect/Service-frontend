import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    format,
} from "date-fns";
import calendarService from "../services/calendar.service";
import { toast } from "sonner";

export const useCalendar = (initialView = "month") => {
    const queryClient = useQueryClient();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState(initialView); // "month" | "week" | "day"

    // Visual Filter Toggles
    const [filters, setFilters] = useState({
        scheduled: true,
        recurring: true,
        events: true,
        notes: true,
    });

    // Modals & Drawers state
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
    const [createMeetingInitialType, setCreateMeetingInitialType] = useState("scheduled");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Compute the requested date range based on viewMode
    const { startDate, endDate } = useMemo(() => {
        if (viewMode === "month") {
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);
            return {
                startDate: startOfWeek(monthStart).toISOString(),
                endDate: endOfWeek(monthEnd).toISOString(),
            };
        } else if (viewMode === "week") {
            return {
                startDate: startOfWeek(currentDate).toISOString(),
                endDate: endOfWeek(currentDate).toISOString(),
            };
        } else {
            // Day view - query a 3-day buffer around current date for smooth transitions
            return {
                startDate: subDays(currentDate, 1).toISOString(),
                endDate: addDays(currentDate, 1).toISOString(),
            };
        }
    }, [currentDate, viewMode]);

    // Feed Query
    const {
        data: feedData,
        isLoading: isLoadingFeed,
        isError: isFeedError,
        error: feedError,
        refetch: refetchFeed,
    } = useQuery({
        queryKey: ["calendar-feed", startDate, endDate],
        queryFn: () => calendarService.getCalendarFeed({ startDate, endDate }),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const meetings = feedData?.meetings || [];
    const events = feedData?.events || [];
    const notes = feedData?.notes || [];

    // Filtered Items
    const filteredMeetings = useMemo(() => {
        return meetings.filter((m) => {
            if (m.isRecurring) return filters.recurring;
            return filters.scheduled;
        });
    }, [meetings, filters]);

    const filteredEvents = useMemo(() => {
        if (!filters.events) return [];
        return events;
    }, [events, filters.events]);

    // Map of notes keyed by "YYYY-MM-DD"
    const notesMap = useMemo(() => {
        const map = new Map();
        for (const note of notes) {
            if (note.date) {
                map.set(note.date, note);
            }
        }
        return map;
    }, [notes]);

    // Active Note for selectedDate
    const selectedDateKey = useMemo(() => {
        return format(selectedDate, "yyyy-MM-dd");
    }, [selectedDate]);

    const activeNote = notesMap.get(selectedDateKey) || null;

    // Save Note Mutation
    const saveNoteMutation = useMutation({
        mutationFn: ({ date, content, color }) =>
            calendarService.saveDateNote(date, { content, color }),
        onSuccess: (savedNote) => {
            queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });
            toast.success("Note saved for " + format(new Date(savedNote.date + "T00:00:00"), "MMM d, yyyy"));
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to save note");
        },
    });

    // Delete Note Mutation
    const deleteNoteMutation = useMutation({
        mutationFn: (date) => calendarService.deleteDateNote(date),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });
            toast.success("Note deleted");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete note");
        },
    });

    // Create Event Mutation
    const createEventMutation = useMutation({
        mutationFn: (data) => calendarService.createEvent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });
            setIsCreateEventOpen(false);
            toast.success("Event created successfully");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to create event");
        },
    });

    // Update Event Mutation
    const updateEventMutation = useMutation({
        mutationFn: ({ id, data }) => calendarService.updateEvent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });
            setSelectedEvent(null);
            toast.success("Event updated successfully");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update event");
        },
    });

    // Delete Event Mutation
    const deleteEventMutation = useMutation({
        mutationFn: (id) => calendarService.deleteEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["calendar-feed"] });
            setSelectedEvent(null);
            toast.success("Event deleted");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete event");
        },
    });

    // Date Navigation Actions
    const goToToday = useCallback(() => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    }, []);

    const goToPrev = useCallback(() => {
        if (viewMode === "month") {
            setCurrentDate((prev) => subMonths(prev, 1));
        } else if (viewMode === "week") {
            setCurrentDate((prev) => subWeeks(prev, 1));
        } else {
            setCurrentDate((prev) => subDays(prev, 1));
            setSelectedDate((prev) => subDays(prev, 1));
        }
    }, [viewMode]);

    const goToNext = useCallback(() => {
        if (viewMode === "month") {
            setCurrentDate((prev) => addMonths(prev, 1));
        } else if (viewMode === "week") {
            setCurrentDate((prev) => addWeeks(prev, 1));
        } else {
            setCurrentDate((prev) => addDays(prev, 1));
            setSelectedDate((prev) => addDays(prev, 1));
        }
    }, [viewMode]);

    const selectDate = useCallback((date) => {
        setSelectedDate(date);
    }, []);

    const jumpToDate = useCallback((date) => {
        setCurrentDate(date);
        setSelectedDate(date);
    }, []);

    const toggleFilter = useCallback((key) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    return {
        currentDate,
        selectedDate,
        selectedDateKey,
        viewMode,
        setViewMode,
        filters,
        toggleFilter,
        isSidebarOpen,
        setIsSidebarOpen,

        // Data
        meetings: filteredMeetings,
        events: filteredEvents,
        notes,
        notesMap,
        activeNote,
        isLoading: isLoadingFeed,
        isError: isFeedError,
        error: feedError,
        refetch: refetchFeed,

        // Navigation
        goToToday,
        goToPrev,
        goToNext,
        selectDate,
        jumpToDate,

        // Modals & Selections
        selectedMeeting,
        setSelectedMeeting,
        selectedEvent,
        setSelectedEvent,
        isCreateEventOpen,
        setIsCreateEventOpen,
        isCreateMeetingOpen,
        setIsCreateMeetingOpen,
        createMeetingInitialType,
        setCreateMeetingInitialType,

        // Mutations
        saveNote: (date, content, color) => saveNoteMutation.mutateAsync({ date, content, color }),
        deleteNote: (date) => deleteNoteMutation.mutateAsync(date),
        isSavingNote: saveNoteMutation.isPending,
        isDeletingNote: deleteNoteMutation.isPending,

        createEvent: (data) => createEventMutation.mutateAsync(data),
        updateEvent: (id, data) => updateEventMutation.mutateAsync({ id, data }),
        deleteEvent: (id) => deleteEventMutation.mutateAsync(id),
        isCreatingEvent: createEventMutation.isPending,
        isUpdatingEvent: updateEventMutation.isPending,
        isDeletingEvent: deleteEventMutation.isPending,
    };
};

export default useCalendar;
