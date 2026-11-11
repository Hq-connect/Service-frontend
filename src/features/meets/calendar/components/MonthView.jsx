import React, { useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    format,
} from "date-fns";
import { Video, Repeat, Star, FileText, Plus, MoreHorizontal } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MonthView = ({
    currentDate,
    selectedDate,
    onSelectDate,
    meetings = [],
    events = [],
    notesMap = new Map(),
    onSelectMeeting,
    onSelectEvent,
    onQuickAdd,
}) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Group items by date string "YYYY-MM-DD"
    const itemsByDate = new Map();

    // Group meetings
    for (const m of meetings) {
        if (!m.scheduledAt) continue;
        const d = new Date(m.scheduledAt);
        const key = format(d, "yyyy-MM-dd");
        if (!itemsByDate.has(key)) itemsByDate.set(key, []);
        itemsByDate.get(key).push({
            ...m,
            itemType: m.isRecurring ? "recurring" : "meeting",
            time: format(d, "h:mm a"),
            sortTime: d.getTime(),
        });
    }

    // Group events
    for (const e of events) {
        if (!e.startDate) continue;
        const d = new Date(e.startDate);
        const key = format(d, "yyyy-MM-dd");
        if (!itemsByDate.has(key)) itemsByDate.set(key, []);
        itemsByDate.get(key).push({
            ...e,
            itemType: "event",
            time: e.allDay ? "All day" : format(d, "h:mm a"),
            sortTime: d.getTime(),
        });
    }

    // Sort items within each day
    for (const [key, list] of itemsByDate.entries()) {
        list.sort((a, b) => a.sortTime - b.sortTime);
    }

    return (
        <div className="flex flex-col flex-1 bg-card rounded-xl border border-border shadow-(--shadow-card) overflow-hidden select-none">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/35">
                {WEEKDAYS.map((day, idx) => (
                    <div
                        key={day}
                        className={`py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider ${
                            idx === 0 || idx === 6 ? "text-muted-foreground/60" : "text-muted-foreground"
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-[540px] divide-x divide-y divide-border/70">
                {days.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayItems = itemsByDate.get(dateKey) || [];
                    const hasNote = notesMap.has(dateKey);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);

                    const visibleItems = dayItems.slice(0, 3);
                    const overflowCount = dayItems.length - 3;

                    return (
                        <div
                            key={dateKey}
                            onClick={() => onSelectDate(day)}
                            className={`min-h-[96px] lg:min-h-[112px] p-2 flex flex-col transition-colors cursor-pointer relative group ${
                                !isCurrentMonth
                                    ? "bg-muted/20 text-muted-foreground/40"
                                    : "bg-card text-foreground hover:bg-muted/25"
                            } ${isSelected ? "bg-muted/45" : ""}`}
                        >
                            {/* Top Selection Indicator Bar */}
                            {isSelected && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary pointer-events-none" />
                            )}

                            {/* Day Header: Date Number + Indicators */}
                            <div className="flex items-center justify-between mb-1.5 relative z-10">
                                <span
                                    className={`inline-flex items-center justify-center size-6 rounded-md text-xs font-mono tabular-nums transition-all ${
                                        isCurrentDay
                                            ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                                            : isSelected
                                            ? "bg-muted text-foreground font-bold border border-border"
                                            : isCurrentMonth
                                            ? "text-foreground/90 font-medium group-hover:text-foreground"
                                            : "text-muted-foreground/45"
                                    }`}
                                >
                                    {format(day, "d")}
                                </span>

                                <div className="flex items-center gap-1">
                                    {/* Personal Note Indicator */}
                                    {hasNote && (
                                        <span
                                            title="Note saved for this date"
                                            className="size-5 inline-flex items-center justify-center rounded-md bg-status-live text-status-live-foreground border border-status-live-border"
                                        >
                                            <FileText className="size-2.5" />
                                        </span>
                                    )}

                                    {/* Quick add button on hover */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectDate(day);
                                            onQuickAdd && onQuickAdd(day);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 size-5 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
                                        title="Add event on this date"
                                    >
                                        <Plus className="size-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Items Chips Stack */}
                            <div className="flex-1 space-y-1 overflow-hidden">
                                {visibleItems.map((item) => {
                                    if (item.itemType === "meeting") {
                                        return (
                                            <div
                                                key={item._id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectMeeting(item);
                                                }}
                                                style={{ borderLeftColor: "var(--chart-2)" }}
                                                className="flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground border border-border/60 border-l-2 text-[11px] font-medium transition-colors truncate cursor-pointer"
                                                title={`${item.time} - ${item.title}`}
                                            >
                                                <span className="truncate">{item.title}</span>
                                                <span className="shrink-0 text-[9px] font-mono tabular-nums text-muted-foreground">
                                                    {item.time.replace(":00", "")}
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (item.itemType === "recurring") {
                                        return (
                                            <div
                                                key={item._id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectMeeting(item);
                                                }}
                                                style={{ borderLeftColor: "var(--chart-3)" }}
                                                className="flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded bg-muted/60 hover:bg-muted text-foreground border border-border/60 border-l-2 text-[11px] font-medium transition-colors truncate cursor-pointer"
                                                title={`${item.time} - ${item.title} (Recurring)`}
                                            >
                                                <span className="truncate flex items-center gap-1">
                                                    <Repeat className="size-2.5 shrink-0 text-muted-foreground" />
                                                    <span className="truncate">{item.title}</span>
                                                </span>
                                                <span className="shrink-0 text-[9px] font-mono tabular-nums text-muted-foreground">
                                                    {item.time.replace(":00", "")}
                                                </span>
                                            </div>
                                        );
                                    }

                                    // Important event
                                    return (
                                        <div
                                            key={item._id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectEvent(item);
                                            }}
                                            style={{ borderLeftColor: "var(--status-warn-fg)" }}
                                            className="flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded bg-status-warn/60 hover:bg-status-warn text-foreground border border-status-warn-border/60 border-l-2 text-[11px] font-medium transition-colors truncate cursor-pointer"
                                            title={`${item.time} - ${item.title}`}
                                        >
                                            <span className="truncate">{item.title}</span>
                                            <span className="shrink-0 text-[9px] font-mono tabular-nums text-muted-foreground">
                                                {item.allDay ? "All day" : item.time.replace(":00", "")}
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* +N more overflow popover */}
                                {overflowCount > 0 && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                                            >
                                                +{overflowCount} more
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            className="w-64 p-3 space-y-2 bg-popover border border-border rounded-xl shadow-lg"
                                        >
                                            <div className="flex items-center justify-between pb-1.5 border-b border-border">
                                                <span className="text-xs font-semibold text-foreground">
                                                    {format(day, "EEEE, MMMM d")}
                                                </span>
                                                <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                                                    {dayItems.length} items
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                {dayItems.map((item) => (
                                                    <div
                                                        key={item._id}
                                                        onClick={() => {
                                                            if (item.itemType === "event") {
                                                                onSelectEvent(item);
                                                            } else {
                                                                onSelectMeeting(item);
                                                            }
                                                        }}
                                                        className="p-2 rounded-lg text-xs border border-border bg-muted/30 hover:bg-muted/60 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            {item.itemType === "recurring" ? (
                                                                <Repeat className="size-3 shrink-0 text-muted-foreground" />
                                                            ) : item.itemType === "event" ? (
                                                                <Star className="size-3 shrink-0 text-status-warn-foreground" />
                                                            ) : (
                                                                <Video className="size-3 shrink-0 text-primary" />
                                                            )}
                                                            <span className="font-medium text-foreground truncate">
                                                                {item.title}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
                                                            {item.time}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;
