import React, { useState, useEffect } from "react";
import { format, isSameDay, isToday } from "date-fns";
import {
    Calendar as CalendarIcon,
    FileText,
    Save,
    Trash2,
    Loader2,
    Video,
    Repeat,
    Star,
    Clock,
    ArrowRight,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

export const CalendarSidebar = ({
    selectedDate,
    onSelectDate,
    meetings = [],
    events = [],
    activeNote,
    onSaveNote,
    onDeleteNote,
    isSavingNote,
    isDeletingNote,
    onSelectMeeting,
    onSelectEvent,
    onJoinMeeting,
}) => {
    const selectedKey = format(selectedDate, "yyyy-MM-dd");

    const [noteContent, setNoteContent] = useState("");
    const [noteColor, setNoteColor] = useState("default");
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (activeNote) {
            setNoteContent(activeNote.content || "");
            setNoteColor(activeNote.color || "default");
            setIsDirty(false);
        } else {
            setNoteContent("");
            setNoteColor("default");
            setIsDirty(false);
        }
    }, [activeNote, selectedKey]);

    const handleSaveNote = async () => {
        await onSaveNote(selectedKey, noteContent, noteColor);
        setIsDirty(false);
    };

    const handleDeleteNote = async () => {
        await onDeleteNote(selectedKey);
        setNoteContent("");
        setIsDirty(false);
    };

    // Filter items for selected day
    const dayMeetings = meetings.filter(
        (m) => m.scheduledAt && format(new Date(m.scheduledAt), "yyyy-MM-dd") === selectedKey
    );
    const dayEvents = events.filter(
        (e) => e.startDate && format(new Date(e.startDate), "yyyy-MM-dd") === selectedKey
    );

    return (
        <aside className="w-80 shrink-0 space-y-4">
            {/* Mini Calendar Card */}
            <div className="bg-card rounded-xl border border-border p-3 shadow-xs flex flex-col items-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && onSelectDate(date)}
                    className="p-1"
                />
            </div>

            {/* Selected Date Scratchpad Card */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <FileText className="size-3.5" />
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-foreground">Date Scratchpad</h3>
                            <p className="text-[10px] text-muted-foreground">
                                {format(selectedDate, "EEE, MMM d, yyyy")}
                            </p>
                        </div>
                    </div>

                    {activeNote && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDeleteNote}
                            disabled={isDeletingNote}
                            className="size-6 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete note"
                        >
                            {isDeletingNote ? (
                                <Loader2 className="size-3 animate-spin" />
                            ) : (
                                <Trash2 className="size-3" />
                            )}
                        </Button>
                    )}
                </div>

                <Textarea
                    value={noteContent}
                    onChange={(e) => {
                        setNoteContent(e.target.value);
                        setIsDirty(true);
                    }}
                    placeholder="Quick thoughts, agenda items, or notes for this date..."
                    className="min-h-[100px] text-xs resize-none bg-muted/20 border-border"
                />

                <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                        {noteContent.length > 0 ? `${noteContent.length} chars` : "Personal note"}
                    </span>

                    <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={isSavingNote || (!isDirty && !!activeNote)}
                        className="h-7 text-xs gap-1 cursor-pointer shadow-xs"
                    >
                        {isSavingNote ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : (
                            <Save className="size-3" />
                        )}
                        Save
                    </Button>
                </div>
            </div>

            {/* Selected Date Agenda Overview Card */}
            <div className="bg-card rounded-xl border border-border p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        Day Agenda
                    </h3>
                    <Badge variant="outline" className="text-[10px] py-0">
                        {dayMeetings.length + dayEvents.length} items
                    </Badge>
                </div>

                {dayMeetings.length === 0 && dayEvents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                        No meetings or events on this date.
                    </div>
                ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {/* Events */}
                        {dayEvents.map((evt) => (
                            <div
                                key={evt._id}
                                onClick={() => onSelectEvent(evt)}
                                className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs hover:bg-amber-500/15 transition-colors cursor-pointer space-y-1"
                            >
                                <div className="flex items-center justify-between text-amber-500 font-medium">
                                    <span className="flex items-center gap-1 truncate">
                                        <Star className="size-3 shrink-0" />
                                        <span className="truncate">{evt.title}</span>
                                    </span>
                                    <span className="text-[10px] opacity-80 shrink-0">
                                        {evt.allDay ? "All Day" : format(new Date(evt.startDate), "h:mm a")}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Meetings */}
                        {dayMeetings.map((m) => {
                            const isRec = m.isRecurring || m.type === "recurring";
                            return (
                                <div
                                    key={m._id}
                                    onClick={() => onSelectMeeting(m)}
                                    className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer space-y-1.5 ${
                                        isRec
                                            ? "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15"
                                            : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15"
                                    }`}
                                >
                                    <div className="flex items-center justify-between font-medium">
                                        <span
                                            className={`flex items-center gap-1 truncate ${
                                                isRec ? "text-purple-400" : "text-blue-500"
                                            }`}
                                        >
                                            {isRec ? (
                                                <Repeat className="size-3 shrink-0" />
                                            ) : (
                                                <Video className="size-3 shrink-0" />
                                            )}
                                            <span className="truncate">{m.title}</span>
                                        </span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                            {format(new Date(m.scheduledAt), "h:mm a")}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-0.5">
                                        <span className="text-[10px] text-muted-foreground">
                                            {m.duration} mins
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onJoinMeeting(m.joinCode);
                                            }}
                                            className="h-5 px-1.5 text-[10px] gap-1 cursor-pointer text-primary hover:text-primary/90 hover:bg-primary/10"
                                        >
                                            Join
                                            <ArrowRight className="size-2.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default CalendarSidebar;
