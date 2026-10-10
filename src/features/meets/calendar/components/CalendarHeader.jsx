import React from "react";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Video,
    Repeat,
    Star,
    FileText,
    PanelRightClose,
    PanelRightOpen,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek } from "date-fns";

export const CalendarHeader = ({
    currentDate,
    viewMode,
    setViewMode,
    goToToday,
    goToPrev,
    goToNext,
    filters,
    toggleFilter,
    counts = {},
    onOpenCreateMeeting,
    onOpenCreateEvent,
    isSidebarOpen,
    setIsSidebarOpen,
}) => {
    // Dynamic Header Title
    const getHeaderTitle = () => {
        if (viewMode === "month") {
            return format(currentDate, "MMMM yyyy");
        } else if (viewMode === "week") {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            const sameMonth = start.getMonth() === end.getMonth();
            if (sameMonth) {
                return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
            }
            return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
        } else {
            return format(currentDate, "EEEE, MMMM d, yyyy");
        }
    };

    return (
        <div className="flex flex-col gap-4 pb-4 border-b border-border">
            {/* Top Row: Date Title + Navigation + View Switcher + Primary Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Month/Week/Day title + navigation buttons */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                        <CalendarIcon className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground font-heading">
                            {getHeaderTitle()}
                        </h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="size-3" />
                            {Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"} timezone
                        </p>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToToday}
                            className="h-8 px-2.5 text-xs font-medium cursor-pointer"
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPrev}
                            className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                            aria-label="Previous period"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNext}
                            className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                            aria-label="Next period"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Right: View Switcher Tabs + Actions + Sidebar Toggle */}
                <div className="flex items-center flex-wrap gap-2.5">
                    {/* View Switcher Pills */}
                    <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border border-border">
                        {["month", "week", "day"].map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
                                    viewMode === mode
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpenCreateEvent}
                        className="h-8 gap-1.5 text-xs cursor-pointer border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    >
                        <Star className="size-3.5" />
                        Add Event
                    </Button>

                    <Button
                        size="sm"
                        onClick={onOpenCreateMeeting}
                        className="h-8 gap-1.5 text-xs cursor-pointer bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                    >
                        <Plus className="size-3.5" />
                        Schedule Meet
                    </Button>

                    {/* Sidebar Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    >
                        {isSidebarOpen ? (
                            <PanelRightClose className="size-4" />
                        ) : (
                            <PanelRightOpen className="size-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Filter / Legend Toggles */}
            <div className="flex items-center flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                <span className="font-medium mr-1 text-foreground/80">Filter:</span>

                <button
                    type="button"
                    onClick={() => toggleFilter("scheduled")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        filters.scheduled
                            ? "bg-blue-500/15 text-blue-500 border-blue-500/30 font-medium"
                            : "bg-muted/40 text-muted-foreground border-border opacity-60"
                    }`}
                >
                    <Video className="size-3" />
                    <span>Meetings</span>
                    {counts.scheduled !== undefined && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20">
                            {counts.scheduled}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => toggleFilter("recurring")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        filters.recurring
                            ? "bg-purple-500/15 text-purple-400 border-purple-500/30 font-medium"
                            : "bg-muted/40 text-muted-foreground border-border opacity-60"
                    }`}
                >
                    <Repeat className="size-3" />
                    <span>Recurring</span>
                    {counts.recurring !== undefined && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20">
                            {counts.recurring}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => toggleFilter("events")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        filters.events
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-medium"
                            : "bg-muted/40 text-muted-foreground border-border opacity-60"
                    }`}
                >
                    <Star className="size-3" />
                    <span>Events</span>
                    {counts.events !== undefined && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20">
                            {counts.events}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => toggleFilter("notes")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        filters.notes
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30 font-medium"
                            : "bg-muted/40 text-muted-foreground border-border opacity-60"
                    }`}
                >
                    <FileText className="size-3" />
                    <span>Date Notes</span>
                    {counts.notes !== undefined && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20">
                            {counts.notes}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CalendarHeader;
