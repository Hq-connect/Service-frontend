import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Video,
    Repeat,
    Star,
    Clock,
    FileText,
    ArrowRight,
    Trash2,
    Save,
    Check,
    Loader2,
    Calendar,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export const DayView = ({
    selectedDate,
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

    // Local scratchpad state
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
    const dayMeetings = meetings
        .filter((m) => m.scheduledAt && format(new Date(m.scheduledAt), "yyyy-MM-dd") === selectedKey)
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

    const dayEvents = events
        .filter((e) => e.startDate && format(new Date(e.startDate), "yyyy-MM-dd") === selectedKey)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    return (
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
            {/* Left Column: Day Schedule Timeline (65%) */}
            <div className="flex-1 bg-card rounded-xl border border-border shadow-xs p-5 flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-foreground font-heading">
                            {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {dayMeetings.length} meetings, {dayEvents.length} events scheduled
                        </p>
                    </div>
                </div>

                {/* Timeline Items List */}
                <div className="mt-5 space-y-4 flex-1 overflow-y-auto max-h-[650px] pr-1">
                    {dayMeetings.length === 0 && dayEvents.length === 0 ? (
                        <div className="py-16 text-center border border-dashed border-border rounded-xl">
                            <Calendar className="size-10 mx-auto text-muted-foreground/40 mb-3" />
                            <h3 className="text-sm font-semibold text-foreground">No items on this date</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                                You have no scheduled meetings or events for {format(selectedDate, "MMMM d")}.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Important Events on this Day */}
                            {dayEvents.map((evt) => (
                                <div
                                    key={evt._id}
                                    onClick={() => onSelectEvent(evt)}
                                    className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer flex items-start justify-between gap-4"
                                >
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[11px] font-medium"
                                            >
                                                <Star className="size-3 mr-1" />
                                                {evt.category || "Event"}
                                            </Badge>
                                            {evt.allDay && (
                                                <span className="text-xs text-muted-foreground font-medium">All Day</span>
                                            )}
                                        </div>
                                        <h3 className="text-sm font-semibold text-foreground">{evt.title}</h3>
                                        {evt.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {evt.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {evt.allDay ? "All Day" : format(new Date(evt.startDate), "h:mm a")}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Meetings on this Day */}
                            {dayMeetings.map((m) => {
                                const isRecurring = m.isRecurring || m.type === "recurring";
                                const d = new Date(m.scheduledAt);

                                return (
                                    <div
                                        key={m._id}
                                        onClick={() => onSelectMeeting(m)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                            isRecurring
                                                ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
                                                : "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10"
                                        }`}
                                    >
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center flex-wrap gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[11px] font-medium ${
                                                        isRecurring
                                                            ? "border-purple-500/30 text-purple-400 bg-purple-500/10"
                                                            : "border-blue-500/30 text-blue-500 bg-blue-500/10"
                                                    }`}
                                                >
                                                    {isRecurring ? (
                                                        <>
                                                            <Repeat className="size-3 mr-1" />
                                                            Recurring Series
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Video className="size-3 mr-1" />
                                                            Scheduled
                                                        </>
                                                    )}
                                                </Badge>

                                                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {format(d, "h:mm a")} ({m.duration || 30} mins)
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-base font-semibold text-foreground">
                                                    {m.title}
                                                </h3>
                                                {m.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {m.description}
                                                    </p>
                                                )}
                                            </div>

                                            {isRecurring && m.recurrenceSummary && (
                                                <div className="text-[11px] text-purple-400 font-medium">
                                                    {m.recurrenceSummary}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action: Join Meeting */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onJoinMeeting(m.joinCode);
                                                }}
                                                className="gap-1.5 text-xs cursor-pointer shadow-xs"
                                            >
                                                <Video className="size-3.5" />
                                                Join Room
                                                <ArrowRight className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Right Column: Date Notes Scratchpad (35%) */}
            <div className="w-full lg:w-96 bg-card rounded-xl border border-border shadow-xs p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <FileText className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Date Scratchpad</h3>
                            <p className="text-[11px] text-muted-foreground">
                                Notes for {format(selectedDate, "MMM d, yyyy")}
                            </p>
                        </div>
                    </div>

                    {activeNote && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDeleteNote}
                            disabled={isDeletingNote}
                            className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete note"
                        >
                            {isDeletingNote ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="size-3.5" />
                            )}
                        </Button>
                    )}
                </div>

                {/* Scratchpad Textarea */}
                <div className="mt-4 flex-1 flex flex-col space-y-3">
                    <Textarea
                        value={noteContent}
                        onChange={(e) => {
                            setNoteContent(e.target.value);
                            setIsDirty(true);
                        }}
                        placeholder="Write down personal notes, agendas, talking points, or action items for this date..."
                        className="flex-1 min-h-[220px] resize-none text-xs font-normal leading-relaxed bg-muted/20 focus-visible:bg-background border-border"
                    />

                    <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">
                            {noteContent.length} / 10,000 chars
                        </span>

                        <Button
                            size="sm"
                            onClick={handleSaveNote}
                            disabled={isSavingNote || (!isDirty && !!activeNote)}
                            className="h-8 gap-1.5 text-xs cursor-pointer shadow-xs"
                        >
                            {isSavingNote ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Save className="size-3.5" />
                            )}
                            Save Note
                        </Button>
                    </div>

                    {activeNote && (
                        <p className="text-[10px] text-muted-foreground/75 text-right">
                            Last updated {format(new Date(activeNote.updatedAt || Date.now()), "MMM d, h:mm a")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayView;
