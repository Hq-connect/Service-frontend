import React, { useEffect, useRef, useState } from "react";
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    isToday,
    format,
    setHours,
    setMinutes,
} from "date-fns";
import { Video, Repeat, Star, FileText, Clock } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 64; // px per hour slot

export const WeekView = ({
    currentDate,
    selectedDate,
    onSelectDate,
    meetings = [],
    events = [],
    notesMap = new Map(),
    onSelectMeeting,
    onSelectEvent,
    onQuickAddSlot,
}) => {
    const scrollContainerRef = useRef(null);
    const [currentTimeMinute, setCurrentTimeMinute] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Update current time minute every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTimeMinute(now.getHours() * 60 + now.getMinutes());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Initial scroll to 8:00 AM
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 8 * HOUR_HEIGHT - 20;
        }
    }, []);

    // Group items by day column
    const itemsByDay = weekDays.map((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        const dayMeetings = meetings
            .filter((m) => m.scheduledAt && format(new Date(m.scheduledAt), "yyyy-MM-dd") === dayKey)
            .map((m) => {
                const date = new Date(m.scheduledAt);
                const startMinutes = date.getHours() * 60 + date.getMinutes();
                const duration = m.duration || 30;
                return {
                    ...m,
                    itemType: m.isRecurring ? "recurring" : "meeting",
                    startMinutes,
                    duration,
                    time: format(date, "h:mm a"),
                };
            });

        const dayEvents = events
            .filter((e) => e.startDate && format(new Date(e.startDate), "yyyy-MM-dd") === dayKey)
            .map((e) => {
                const date = new Date(e.startDate);
                const startMinutes = date.getHours() * 60 + date.getMinutes();
                return {
                    ...e,
                    itemType: "event",
                    startMinutes: e.allDay ? 0 : startMinutes,
                    duration: 60,
                    time: e.allDay ? "All day" : format(date, "h:mm a"),
                };
            });

        // Compute sub-columns for overlapping items
        const allItems = [...dayMeetings, ...dayEvents].sort((a, b) => a.startMinutes - b.startMinutes);

        // Simple column assign algorithm for collisions
        const positioned = [];
        const columns = [];

        for (const item of allItems) {
            let placed = false;
            for (let c = 0; c < columns.length; c++) {
                const lastItemInCol = columns[c][columns[c].length - 1];
                if (lastItemInCol.startMinutes + lastItemInCol.duration <= item.startMinutes) {
                    columns[c].push(item);
                    positioned.push({ ...item, colIndex: c });
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([item]);
                positioned.push({ ...item, colIndex: columns.length - 1 });
            }
        }

        const totalCols = Math.max(1, columns.length);
        const finalItems = positioned.map((item) => ({
            ...item,
            totalCols,
            colWidth: 100 / totalCols,
            colLeft: (item.colIndex / totalCols) * 100,
        }));

        return {
            day,
            dayKey,
            items: finalItems,
            hasNote: notesMap.has(dayKey),
            note: notesMap.get(dayKey),
        };
    });

    return (
        <div className="flex flex-col flex-1 bg-card rounded-xl border border-border shadow-xs overflow-hidden">
            {/* Header: Days of the week */}
            <div className="flex border-b border-border bg-muted/40 divide-x divide-border">
                {/* Time Gutter Header */}
                <div className="w-16 shrink-0 py-3 text-center text-xs text-muted-foreground font-medium">
                    <Clock className="size-3.5 mx-auto opacity-70" />
                </div>

                {/* Day Columns Header */}
                <div className="grid grid-cols-7 flex-1 divide-x divide-border">
                    {itemsByDay.map(({ day, dayKey, hasNote }) => {
                        const isCurrentDay = isToday(day);
                        const isSelected = isSameDay(day, selectedDate);

                        return (
                            <div
                                key={dayKey}
                                onClick={() => onSelectDate(day)}
                                className={`py-2 px-1 text-center transition-colors cursor-pointer ${
                                    isSelected ? "bg-accent/20" : "hover:bg-muted/40"
                                }`}
                            >
                                <div className="text-[11px] font-medium text-muted-foreground uppercase">
                                    {format(day, "EEE")}
                                </div>
                                <div className="mt-0.5 flex items-center justify-center gap-1">
                                    <span
                                        className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-semibold ${
                                            isCurrentDay
                                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                                : isSelected
                                                ? "text-primary font-bold"
                                                : "text-foreground"
                                        }`}
                                    >
                                        {format(day, "d")}
                                    </span>
                                    {hasNote && (
                                        <span
                                            title="Date note saved"
                                            className="p-0.5 rounded-full bg-rose-500/20 text-rose-500"
                                        >
                                            <FileText className="size-2.5" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Scrollable Hourly Time Grid */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto max-h-[700px] relative select-none"
            >
                <div className="flex divide-x divide-border relative" style={{ height: 24 * HOUR_HEIGHT }}>
                    {/* Time Gutter Column */}
                    <div className="w-16 shrink-0 divide-y divide-border/40 bg-muted/10 text-right pr-2">
                        {HOURS.map((hour) => {
                            const timeLabel = format(setHours(new Date(), hour), "h a");
                            return (
                                <div
                                    key={hour}
                                    style={{ height: HOUR_HEIGHT }}
                                    className="text-[11px] font-mono text-muted-foreground/80 -translate-y-2.5 select-none"
                                >
                                    {hour !== 0 ? timeLabel : ""}
                                </div>
                            );
                        })}
                    </div>

                    {/* 7 Days Grid Columns */}
                    <div className="grid grid-cols-7 flex-1 divide-x divide-border relative">
                        {itemsByDay.map(({ day, dayKey, items }) => {
                            const isCurrentDay = isToday(day);

                            return (
                                <div
                                    key={dayKey}
                                    onClick={() => onSelectDate(day)}
                                    className="relative h-full divide-y divide-border/40 hover:bg-muted/5 transition-colors"
                                >
                                    {/* Hourly Grid Rows */}
                                    {HOURS.map((hour) => (
                                        <div
                                            key={hour}
                                            style={{ height: HOUR_HEIGHT }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const slotDate = setMinutes(setHours(day, hour), 0);
                                                onSelectDate(day);
                                                onQuickAddSlot && onQuickAddSlot(slotDate);
                                            }}
                                            className="hover:bg-primary/5 transition-colors cursor-pointer"
                                        />
                                    ))}

                                    {/* Live Current Time Line (if today) */}
                                    {isCurrentDay && (
                                        <div
                                            style={{
                                                top: (currentTimeMinute / 60) * HOUR_HEIGHT,
                                            }}
                                            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                        >
                                            <div className="size-2.5 rounded-full bg-red-500 -ml-1.5 shadow-sm shadow-red-500/50 animate-pulse" />
                                            <div className="h-0.5 flex-1 bg-red-500 shadow-xs" />
                                        </div>
                                    )}

                                    {/* Event & Meeting Cards positioned by time */}
                                    {items.map((item) => {
                                        const top = (item.startMinutes / 60) * HOUR_HEIGHT;
                                        const height = Math.max(28, (item.duration / 60) * HOUR_HEIGHT);

                                        if (item.itemType === "meeting") {
                                            return (
                                                <div
                                                    key={item._id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectMeeting(item);
                                                    }}
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${height}px`,
                                                        left: `${item.colLeft}%`,
                                                        width: `calc(${item.colWidth}% - 4px)`,
                                                    }}
                                                    className="absolute m-0.5 p-1.5 rounded-md text-[11px] font-medium bg-blue-500/15 text-blue-500 border border-blue-500/30 hover:bg-blue-500/25 transition-all shadow-xs overflow-hidden cursor-pointer z-10"
                                                    title={`${item.title} (${item.time})`}
                                                >
                                                    <div className="flex items-center gap-1 font-semibold truncate">
                                                        <Video className="size-3 shrink-0" />
                                                        <span className="truncate">{item.title}</span>
                                                    </div>
                                                    <div className="text-[10px] opacity-80 mt-0.5 truncate">
                                                        {item.time} ({item.duration}m)
                                                    </div>
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
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${height}px`,
                                                        left: `${item.colLeft}%`,
                                                        width: `calc(${item.colWidth}% - 4px)`,
                                                    }}
                                                    className="absolute m-0.5 p-1.5 rounded-md text-[11px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25 transition-all shadow-xs overflow-hidden cursor-pointer z-10"
                                                    title={`${item.title} (${item.time} - Recurring)`}
                                                >
                                                    <div className="flex items-center gap-1 font-semibold truncate text-purple-400">
                                                        <Repeat className="size-3 shrink-0" />
                                                        <span className="truncate">{item.title}</span>
                                                    </div>
                                                    <div className="text-[10px] opacity-80 mt-0.5 truncate">
                                                        {item.time} • Series
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Important Event
                                        return (
                                            <div
                                                key={item._id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectEvent(item);
                                                }}
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: `${item.colLeft}%`,
                                                    width: `calc(${item.colWidth}% - 4px)`,
                                                }}
                                                className="absolute m-0.5 p-1.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-xs overflow-hidden cursor-pointer z-10"
                                                title={`${item.title} (${item.time})`}
                                            >
                                                <div className="flex items-center gap-1 font-semibold truncate">
                                                    <Star className="size-3 shrink-0" />
                                                    <span className="truncate">{item.title}</span>
                                                </div>
                                                <div className="text-[10px] opacity-80 mt-0.5 truncate">
                                                    {item.time}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeekView;
