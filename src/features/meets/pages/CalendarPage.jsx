import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCalendar from "../hooks/useCalendar";
import useMeetings from "../hooks/useMeetings";
import CalendarHeader from "../calendar/components/CalendarHeader";
import MonthView from "../calendar/components/MonthView";
import WeekView from "../calendar/components/WeekView";
import DayView from "../calendar/components/DayView";
import CalendarSidebar from "../calendar/components/CalendarSidebar";
import MeetingDetailsModal from "../calendar/components/MeetingDetailsModal";
import CreateEventDialog from "../calendar/components/CreateEventDialog";
import EventDetailsModal from "../calendar/components/EventDetailsModal";
import CreateMeetingDialog from "../components/CreateMeetingDialog";
import EditMeetingDialog from "../components/EditMeetingDialog";
import { Loader2 } from "lucide-react";

export const CalendarPage = () => {
    const navigate = useNavigate();

    // Meetings hook for existing meeting creation & editing logic
    const {
        createMeeting,
        updateMeeting,
        cancelMeeting,
        loading: meetingOpLoading,
    } = useMeetings();

    // Dedicated Calendar Hook
    const {
        currentDate,
        selectedDate,
        viewMode,
        setViewMode,
        filters,
        toggleFilter,
        isSidebarOpen,
        setIsSidebarOpen,

        meetings,
        events,
        notes,
        notesMap,
        activeNote,
        isLoading,

        goToToday,
        goToPrev,
        goToNext,
        selectDate,
        jumpToDate,

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

        saveNote,
        deleteNote,
        isSavingNote,
        isDeletingNote,

        createEvent,
        deleteEvent,
        isCreatingEvent,
        isDeletingEvent,
        refetch,
    } = useCalendar();

    // Editing meeting state (for EditMeetingDialog)
    const [editingMeeting, setEditingMeeting] = useState(null);

    const handleJoinMeeting = (joinCode) => {
        if (joinCode) {
            navigate(`/meets/room/${joinCode}`);
        }
    };

    const handleCreateMeetingSubmit = async (payload) => {
        const created = await createMeeting(payload);
        setIsCreateMeetingOpen(false);
        refetch();
        if (payload.type === "instant" && created?.joinCode) {
            navigate(`/meets/room/${created.joinCode}`);
        }
    };

    const handleUpdateMeetingSubmit = async (meetingId, payload) => {
        await updateMeeting(meetingId, payload);
        setEditingMeeting(null);
        refetch();
    };

    const handleCancelMeeting = async (meetingId) => {
        await cancelMeeting(meetingId);
        setSelectedMeeting(null);
        refetch();
    };

    // Aggregate counts for filter legend
    const scheduledCount = meetings.filter((m) => !m.isRecurring).length;
    const recurringCount = meetings.filter((m) => m.isRecurring).length;
    const eventsCount = events.length;
    const notesCount = notes.length;

    return (
        <div className="space-y-5 max-w-7xl mx-auto w-full min-h-[calc(100vh-100px)] flex flex-col">
            {/* Calendar Controls & Filter Header */}
            <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                setViewMode={setViewMode}
                goToToday={goToToday}
                goToPrev={goToPrev}
                goToNext={goToNext}
                filters={filters}
                toggleFilter={toggleFilter}
                counts={{
                    scheduled: scheduledCount,
                    recurring: recurringCount,
                    events: eventsCount,
                    notes: notesCount,
                }}
                onOpenCreateMeeting={() => {
                    setCreateMeetingInitialType("scheduled");
                    setIsCreateMeetingOpen(true);
                }}
                onOpenCreateEvent={() => setIsCreateEventOpen(true)}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            {/* Main Calendar Body */}
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24">
                    <Loader2 className="size-8 animate-spin text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Loading calendar schedule...</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col lg:flex-row gap-5 items-start">
                    {/* Active View Grid with smooth entrance animation */}
                    <div 
                        key={`${viewMode}-${currentDate.toISOString().slice(0, 7)}`}
                        className="flex-1 w-full flex flex-col min-h-0 animate-in fade-in-50 zoom-in-[0.99] duration-200 ease-out"
                    >
                        {viewMode === "month" && (
                            <MonthView
                                currentDate={currentDate}
                                selectedDate={selectedDate}
                                onSelectDate={(date) => {
                                    selectDate(date);
                                }}
                                meetings={meetings}
                                events={events}
                                notesMap={notesMap}
                                onSelectMeeting={(m) => setSelectedMeeting(m)}
                                onSelectEvent={(e) => setSelectedEvent(e)}
                                onQuickAdd={(date) => {
                                    selectDate(date);
                                    setIsCreateEventOpen(true);
                                }}
                            />
                        )}

                        {viewMode === "week" && (
                            <WeekView
                                currentDate={currentDate}
                                selectedDate={selectedDate}
                                onSelectDate={(date) => {
                                    selectDate(date);
                                }}
                                meetings={meetings}
                                events={events}
                                notesMap={notesMap}
                                onSelectMeeting={(m) => setSelectedMeeting(m)}
                                onSelectEvent={(e) => setSelectedEvent(e)}
                                onQuickAddSlot={(date) => {
                                    selectDate(date);
                                    setIsCreateMeetingOpen(true);
                                }}
                            />
                        )}

                        {viewMode === "day" && (
                            <DayView
                                selectedDate={selectedDate}
                                meetings={meetings}
                                events={events}
                                activeNote={activeNote}
                                onSaveNote={saveNote}
                                onDeleteNote={deleteNote}
                                isSavingNote={isSavingNote}
                                isDeletingNote={isDeletingNote}
                                onSelectMeeting={(m) => setSelectedMeeting(m)}
                                onSelectEvent={(e) => setSelectedEvent(e)}
                                onJoinMeeting={handleJoinMeeting}
                            />
                        )}
                    </div>

                    {/* Collapsible Command Center Sidebar (Visible in Month and Week views) */}
                    {isSidebarOpen && viewMode !== "day" && (
                        <CalendarSidebar
                            selectedDate={selectedDate}
                            onSelectDate={(date) => {
                                selectDate(date);
                            }}
                            meetings={meetings}
                            events={events}
                            activeNote={activeNote}
                            onSaveNote={saveNote}
                            onDeleteNote={deleteNote}
                            isSavingNote={isSavingNote}
                            isDeletingNote={isDeletingNote}
                            onSelectMeeting={(m) => setSelectedMeeting(m)}
                            onSelectEvent={(e) => setSelectedEvent(e)}
                            onJoinMeeting={handleJoinMeeting}
                        />
                    )}
                </div>
            )}

            {/* Item Details Modals */}
            <MeetingDetailsModal
                isOpen={!!selectedMeeting}
                onClose={() => setSelectedMeeting(null)}
                meeting={selectedMeeting}
                onJoin={handleJoinMeeting}
                onEdit={(meeting) => setEditingMeeting(meeting)}
                onCancel={(meetingId) => handleCancelMeeting(meetingId)}
            />

            <EventDetailsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
                onDelete={(id) => deleteEvent(id)}
                isDeleting={isDeletingEvent}
            />

            {/* Create Event Dialog */}
            <CreateEventDialog
                isOpen={isCreateEventOpen}
                onClose={() => setIsCreateEventOpen(false)}
                onSubmit={createEvent}
                loading={isCreatingEvent}
                initialDate={selectedDate}
            />

            {/* Existing Create Meeting Dialog (Supports Scheduled & Recurring) */}
            <CreateMeetingDialog
                isOpen={isCreateMeetingOpen}
                onClose={() => setIsCreateMeetingOpen(false)}
                onSubmit={handleCreateMeetingSubmit}
                loading={meetingOpLoading}
                initialType={createMeetingInitialType}
            />

            {/* Existing Edit Meeting Dialog */}
            {editingMeeting && (
                <EditMeetingDialog
                    isOpen={!!editingMeeting}
                    onClose={() => setEditingMeeting(null)}
                    meeting={editingMeeting}
                    onUpdate={handleUpdateMeetingSubmit}
                    loading={meetingOpLoading}
                />
            )}
        </div>
    );
};

export default CalendarPage;
