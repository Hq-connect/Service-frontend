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
        <div className="flex flex-col flex-1 bg-card rounded-xl border border-border shadow-xs overflow-hidden select-none">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
                {WEEKDAYS.map((day, idx) => (
                    <div
                        key={day}
                        className={`py-2 text-center text-xs font-semibold uppercase tracking-wider ${
                            idx === 0 || idx === 6 ? "text-muted-foreground/70" : "text-muted-foreground"
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 grid-rows-5 lg:grid-rows-6 flex-1 min-h-[600px] divide-x divide-y divide-border/60">
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
                            className={`min-h-[100px] lg:min-h-[120px] p-1.5 lg:p-2 flex flex-col transition-colors cursor-pointer relative group ${
                                !isCurrentMonth
                                    ? "bg-muted/15 text-muted-foreground/40"
                                    : "bg-card text-foreground hover:bg-muted/30"
                            } ${isSelected ? "ring-2 ring-primary/40 bg-accent/15 z-10" : ""}`}
                        >
                            {/* Day Header: Date Number + Indicators */}
                            <div className="flex items-center justify-between mb-1.5">
                                <span
                                    className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-medium transition-all ${
                                        isCurrentDay
                                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                            : isSelected
                                            ? "font-semibold text-primary"
                                            : isCurrentMonth
                                            ? "text-foreground"
                                            : "text-muted-foreground/50"
                                    }`}
                                >
                                    {format(day, "d")}
                                </span>

                                <div className="flex items-center gap-1">
                                    {/* Personal Note Indicator */}
                                    {hasNote && (
                                        <span
                                            title="Personal note saved for this date"
                                            className="p-0.5 rounded-md bg-rose-500/15 text-rose-500 border border-rose-500/20"
                                        >
                                            <FileText className="size-3" />
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
                                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
                                        title="Add meeting or event"
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
                                                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:scale-[1.02] hover:shadow-xs active:scale-[0.98] transition-all duration-150 truncate cursor-pointer"
                                                title={`${item.time} - ${item.title}`}
                                            >
                                                <Video className="size-2.5 shrink-0" />
                                                <span className="shrink-0 text-[10px] opacity-75">{item.time}</span>
                                                <span className="truncate">{item.title}</span>
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
                                                className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:scale-[1.02] hover:shadow-xs active:scale-[0.98] transition-all duration-150 truncate cursor-pointer"
                                                title={`${item.time} - ${item.title} (Recurring)`}
                                            >
                                                <Repeat className="size-2.5 shrink-0 text-purple-500" />
                                                <span className="shrink-0 text-[10px] opacity-75">{item.time}</span>
                                                <span className="truncate">{item.title}</span>
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
                                            className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 hover:scale-[1.02] hover:shadow-xs active:scale-[0.98] transition-all duration-150 truncate cursor-pointer"
                                            title={`${item.time} - ${item.title}`}
                                        >
                                            <Star className="size-2.5 shrink-0 text-amber-500" />
                                            <span className="shrink-0 text-[10px] opacity-75">{item.time}</span>
                                            <span className="truncate">{item.title}</span>
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
                                                className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                                            >
                                                +{overflowCount} more
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            className="w-64 p-3 space-y-2 bg-popover/95 backdrop-blur-md border border-border shadow-lg"
                                        >
                                            <div className="flex items-center justify-between pb-1.5 border-b border-border">
                                                <span className="text-xs font-semibold text-foreground">
                                                    {format(day, "EEEE, MMMM d")}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
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
                                                        className={`p-1.5 rounded-md text-xs border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                                            item.itemType === "recurring"
                                                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                                                                : item.itemType === "event"
                                                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                                                                : "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            {item.itemType === "recurring" ? (
                                                                <Repeat className="size-3 shrink-0" />
                                                            ) : item.itemType === "event" ? (
                                                                <Star className="size-3 shrink-0" />
                                                            ) : (
                                                                <Video className="size-3 shrink-0" />
                                                            )}
                                                            <span className="font-medium truncate">{item.title}</span>
                                                        </div>
                                                        <span className="text-[10px] opacity-75 shrink-0">{item.time}</span>
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
