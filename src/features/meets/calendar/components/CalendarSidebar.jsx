import React, { useState, useEffect } from "react";
import { format, isToday } from "date-fns";
import {
    FileText,
    Save,
    Trash2,
    Loader2,
    Video,
    Repeat,
    Star,
    Clock,
    ArrowRight,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
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
    const [showMiniCal, setShowMiniCal] = useState(false);

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

    const dayMeetings = meetings.filter(
        (m) => m.scheduledAt && format(new Date(m.scheduledAt), "yyyy-MM-dd") === selectedKey
    );
    const dayEvents = events.filter(
        (e) => e.startDate && format(new Date(e.startDate), "yyyy-MM-dd") === selectedKey
    );
    const totalItems = dayMeetings.length + dayEvents.length;

    return (
        <aside className="w-full xl:w-80 shrink-0 rounded-xl border border-border bg-card shadow-(--shadow-card) flex flex-col overflow-hidden select-none">
            {/* 1. Selected Date Inspector Header */}
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between gap-2 bg-muted/20">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                            {format(selectedDate, "EEEE, MMM d")}
                        </h3>
                        {isToday(selectedDate) && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                Today
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] font-mono tabular-nums text-muted-foreground mt-0.5">
                        {format(selectedDate, "yyyy")} · {totalItems} scheduled item{totalItems === 1 ? "" : "s"}
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setShowMiniCal((prev) => !prev)}
                    className="gap-1 text-[11px] h-7 cursor-pointer shrink-0"
                    title="Toggle mini date picker"
                >
                    <CalendarIcon className="size-3" />
                    {showMiniCal ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </Button>
            </div>

            {/* Collapsible Mini Calendar Picker */}
            {showMiniCal && (
                <div className="p-3 border-b border-border bg-muted/10 flex justify-center animate-fade-in">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && onSelectDate(date)}
                        className="p-0"
                    />
                </div>
            )}

            {/* 2. Day Agenda Section */}
            <div className="p-4 border-b border-border space-y-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        Day Agenda
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono tabular-nums py-0 px-1.5">
                        {totalItems}
                    </Badge>
                </div>

                {totalItems === 0 ? (
                    <div className="py-5 px-3 rounded-lg border border-dashed border-border text-center">
                        <p className="text-xs font-medium text-foreground">Clear day</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            No meetings or events on {format(selectedDate, "MMM d")}.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                        {dayEvents.map((evt) => (
                            <div
                                key={evt._id}
                                onClick={() => onSelectEvent(evt)}
                                style={{ borderLeftColor: "var(--status-warn-fg)" }}
                                className="p-2.5 rounded-lg bg-muted/35 hover:bg-muted/60 border border-border border-l-2 text-xs transition-colors cursor-pointer flex items-center justify-between gap-2"
                            >
                                <span className="flex items-center gap-1.5 font-medium text-foreground truncate">
                                    <Star className="size-3 text-status-warn-foreground shrink-0" />
                                    <span className="truncate">{evt.title}</span>
                                </span>
                                <span className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
                                    {evt.allDay ? "All day" : format(new Date(evt.startDate), "HH:mm")}
                                </span>
                            </div>
                        ))}

                        {dayMeetings.map((m) => {
                            const isRec = m.isRecurring || m.type === "recurring";
                            return (
                                <div
                                    key={m._id}
                                    onClick={() => onSelectMeeting(m)}
                                    style={{
                                        borderLeftColor: isRec ? "var(--chart-3)" : "var(--chart-2)",
                                    }}
                                    className="p-2.5 rounded-lg bg-muted/35 hover:bg-muted/60 border border-border border-l-2 text-xs transition-colors cursor-pointer space-y-1.5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                                            {isRec ? (
                                                <Repeat className="size-3 text-muted-foreground shrink-0" />
                                            ) : (
                                                <Video className="size-3 text-primary shrink-0" />
                                            )}
                                            <span className="truncate">{m.title}</span>
                                        </span>
                                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
                                            {format(new Date(m.scheduledAt), "HH:mm")}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-0.5">
                                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                                            {m.duration || 30}m · {m.joinCode}
                                        </span>
                                        <Button
                                            size="xs"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onJoinMeeting(m.joinCode);
                                            }}
                                            className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
                                        >
                                            <span>Join</span>
                                            <ArrowRight className="size-2.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. Date Scratchpad Section */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FileText className="size-3.5" />
                            Date Scratchpad
                        </span>

                        {activeNote && (
                            <button
                                type="button"
                                onClick={handleDeleteNote}
                                disabled={isDeletingNote}
                                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                title="Delete note"
                            >
                                {isDeletingNote ? (
                                    <Loader2 className="size-3 animate-spin" />
                                ) : (
                                    <Trash2 className="size-3" />
                                )}
                            </button>
                        )}
                    </div>

                    <Textarea
                        value={noteContent}
                        onChange={(e) => {
                            setNoteContent(e.target.value);
                            setIsDirty(true);
                        }}
                        placeholder={`Jot down agenda notes or reminders for ${format(selectedDate, "MMM d")}...`}
                        className="min-h-[110px] text-xs resize-none bg-muted/20 border-border focus-visible:bg-background"
                    />
                </div>

                <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                        {noteContent.length > 0 ? `${noteContent.length} chars` : "Private note"}
                    </span>

                    <Button
                        size="xs"
                        onClick={handleSaveNote}
                        disabled={isSavingNote || (!isDirty && !!activeNote)}
                        className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                    >
                        {isSavingNote ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : (
                            <Save className="size-3" />
                        )}
                        <span>Save Note</span>
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default CalendarSidebar;
