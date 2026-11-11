import React from "react";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Video,
    Repeat,
    Sparkles,
    FileText,
    PanelRightClose,
    PanelRightOpen,
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

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

    const timezoneStr = (() => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
            return tz.replace("_", " ");
        } catch {
            return "UTC";
        }
    })();

    const filterConfigs = [
        {
            key: "scheduled",
            label: "Meetings",
            icon: Video,
            count: counts.scheduled || 0,
            dotStyle: { backgroundColor: "var(--chart-2)" },
        },
        {
            key: "recurring",
            label: "Recurring",
            icon: Repeat,
            count: counts.recurring || 0,
            dotStyle: { backgroundColor: "var(--chart-3)" },
        },
        {
            key: "events",
            label: "Events",
            icon: Sparkles,
            count: counts.events || 0,
            dotStyle: { backgroundColor: "var(--status-warn-fg)" },
        },
        {
            key: "notes",
            label: "Notes",
            icon: FileText,
            count: counts.notes || 0,
            dotStyle: { backgroundColor: "var(--status-live-fg)" },
        },
    ];

    return (
        <div className="rounded-xl border border-border bg-card shadow-(--shadow-card) px-4 py-3 flex flex-col gap-3 select-none">
            {/* Primary Row: Date Navigation, View Switcher & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Title + Today + Arrows */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="inline-flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                        <button
                            type="button"
                            onClick={goToPrev}
                            className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer"
                            aria-label="Previous period"
                        >
                            <ChevronLeft className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={goToToday}
                            className="px-2.5 h-7 text-xs font-semibold text-foreground hover:bg-background rounded-md transition-colors cursor-pointer"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={goToNext}
                            className="size-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors cursor-pointer"
                            aria-label="Next period"
                        >
                            <ChevronRight className="size-3.5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 ml-1">
                        <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                            {getHeaderTitle()}
                        </h1>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono tabular-nums rounded-md bg-muted/60 text-muted-foreground border border-border">
                            <Clock className="size-2.5 text-muted-foreground" />
                            {timezoneStr}
                        </span>
                    </div>
                </div>

                {/* Right: View Switcher + Actions */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* Segmented View Switcher */}
                    <div className="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border text-xs">
                        {["month", "week", "day"].map((mode) => {
                            const isActive = viewMode === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setViewMode(mode)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer",
                                        isActive
                                            ? "bg-background text-foreground font-semibold shadow-2xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {mode}
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpenCreateEvent}
                        className="gap-1.5 cursor-pointer text-xs h-8"
                    >
                        <Plus className="size-3.5 text-muted-foreground" />
                        <span>Add Event</span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={onOpenCreateMeeting}
                        className="gap-1.5 cursor-pointer text-xs h-8 shadow-2xs"
                    >
                        <Video className="size-3.5" />
                        <span>Schedule Meet</span>
                    </Button>

                    {viewMode !== "day" && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                            title={isSidebarOpen ? "Hide inspector panel" : "Show inspector panel"}
                        >
                            {isSidebarOpen ? (
                                <PanelRightClose className="size-3.5" />
                            ) : (
                                <PanelRightOpen className="size-3.5" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Secondary Row: Clean Filter Pills */}
            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                        Show:
                    </span>

                    {filterConfigs.map((cfg) => {
                        const isActive = !!filters[cfg.key];
                        return (
                            <button
                                key={cfg.key}
                                type="button"
                                onClick={() => toggleFilter(cfg.key)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                                    isActive
                                        ? "bg-muted/70 text-foreground border-border shadow-2xs"
                                        : "bg-transparent text-muted-foreground/60 border-transparent hover:bg-muted/30 hover:text-muted-foreground"
                                )}
                            >
                                <span
                                    className="size-2 rounded-full shrink-0 transition-opacity"
                                    style={{
                                        ...cfg.dotStyle,
                                        opacity: isActive ? 1 : 0.35,
                                    }}
                                />
                                <span>{cfg.label}</span>
                                <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-background border border-border/60 text-muted-foreground">
                                    {cfg.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <span className="hidden md:inline text-[11px] text-muted-foreground">
                    Click any date cell to inspect agenda or jot down notes
                </span>
            </div>
        </div>
    );
};

export default CalendarHeader;
