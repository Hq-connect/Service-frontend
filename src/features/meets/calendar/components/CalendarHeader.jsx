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
    Layers,
    RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
            dotColor: "bg-sky-500",
            activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25 shadow-xs",
            badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
        },
        {
            key: "recurring",
            label: "Recurring",
            icon: Repeat,
            count: counts.recurring || 0,
            dotColor: "bg-indigo-500",
            activeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 shadow-xs",
            badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
        },
        {
            key: "events",
            label: "Events",
            icon: Sparkles,
            count: counts.events || 0,
            dotColor: "bg-amber-500",
            activeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shadow-xs",
            badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        },
        {
            key: "notes",
            label: "Date Notes",
            icon: FileText,
            count: counts.notes || 0,
            dotColor: "bg-rose-500",
            activeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-xs",
            badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
        },
    ];

    const allFiltersActive = Object.values(filters).every(Boolean);

    return (
        <div className="flex flex-col gap-4 pb-4 border-b border-border/70 select-none">
            {/* Top Bar: Title, Date Navigator, View Mode Switcher, Primary Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Area: Sleek Date Navigator */}
                <div className="flex items-center gap-3.5 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                            {getHeaderTitle()}
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-muted/60 text-muted-foreground border border-border/40">
                            <Clock className="size-3 text-muted-foreground/80" />
                            {timezoneStr}
                        </span>
                    </div>

                    {/* Integrated Date Navigation Segment */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/60 shadow-2xs">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToPrev}
                            className="size-7 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-background/80"
                            aria-label="Previous period"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <button
                            type="button"
                            onClick={goToToday}
                            className="h-7 px-2.5 text-xs font-semibold rounded-md text-foreground hover:bg-background/80 transition-all cursor-pointer"
                        >
                            Today
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNext}
                            className="size-7 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-background/80"
                            aria-label="Next period"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Right Area: View Mode Switcher with Physical Shadow Slider + Actions */}
                <div className="flex items-center flex-wrap gap-2.5">
                    {/* Apple/Linear-style Segmented View Switcher with Physical Shadow Slider */}
                    <div className="relative inline-flex p-1 rounded-xl bg-muted/70 border border-border/80 shadow-inner select-none">
                        {/* Physical Sliding Shadow Pill */}
                        <div
                            className="absolute top-1 bottom-1 w-[58px] rounded-lg bg-background shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.08)] border border-border/60 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                            style={{
                                transform: `translateX(${
                                    viewMode === "month"
                                        ? "0px"
                                        : viewMode === "week"
                                        ? "58px"
                                        : "116px"
                                })`,
                            }}
                        />

                        {["month", "week", "day"].map((mode) => {
                            const isActive = viewMode === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setViewMode(mode)}
                                    className={`relative z-10 w-[58px] py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors duration-200 text-center cursor-pointer ${
                                        isActive
                                            ? "text-foreground font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {mode}
                                </button>
                            );
                        })}
                    </div>

                    {/* Action: Add Event */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpenCreateEvent}
                        className="h-8.5 px-3 text-xs font-medium cursor-pointer rounded-lg border-border/80 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95 transition-all duration-200"
                    >
                        <Sparkles className="size-3.5 text-amber-500 mr-1.5" />
                        Add Event
                    </Button>

                    {/* Action: Schedule Meet */}
                    <Button
                        size="sm"
                        onClick={onOpenCreateMeeting}
                        className="h-8.5 px-3.5 text-xs font-semibold cursor-pointer rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-all duration-200"
                    >
                        <Plus className="size-4 mr-1" />
                        Schedule Meet
                    </Button>

                    {/* Sidebar Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="size-8.5 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-90 transition-all duration-150"
                        title={isSidebarOpen ? "Collapse details panel" : "Expand details panel"}
                    >
                        {isSidebarOpen ? (
                            <PanelRightClose className="size-4" />
                        ) : (
                            <PanelRightOpen className="size-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Bottom Bar: Modern Filter Layers with Dot Indicators & Hover Transitions */}
            <div className="flex items-center justify-between gap-3 pt-1 text-xs flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mr-1 flex items-center gap-1.5">
                        <Layers className="size-3" />
                        Layers
                    </span>

                    {filterConfigs.map((cfg) => {
                        const isActive = !!filters[cfg.key];
                        const Icon = cfg.icon;

                        return (
                            <button
                                key={cfg.key}
                                type="button"
                                onClick={() => toggleFilter(cfg.key)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                                    isActive
                                        ? cfg.activeClass
                                        : "bg-muted/20 text-muted-foreground/60 border-border/40 hover:bg-muted/40 hover:text-muted-foreground"
                                }`}
                            >
                                <span
                                    className={`size-2 rounded-full transition-all duration-300 ${
                                        isActive
                                            ? `${cfg.dotColor} ring-2 ring-current/25 shadow-xs scale-100`
                                            : "bg-muted-foreground/40 scale-75"
                                    }`}
                                />
                                <Icon className={`size-3.5 transition-opacity ${isActive ? "opacity-90" : "opacity-40"}`} />
                                <span>{cfg.label}</span>
                                <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md transition-colors ${
                                        isActive
                                            ? cfg.badgeClass
                                            : "bg-muted/60 text-muted-foreground/60"
                                    }`}
                                >
                                    {cfg.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Subtle Reset / Status hint */}
                {!allFiltersActive && (
                    <button
                        type="button"
                        onClick={() => {
                            if (!filters.scheduled) toggleFilter("scheduled");
                            if (!filters.recurring) toggleFilter("recurring");
                            if (!filters.events) toggleFilter("events");
                            if (!filters.notes) toggleFilter("notes");
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline active:scale-95 cursor-pointer transition-all duration-150"
                    >
                        <RotateCcw className="size-3" />
                        Reset all layers
                    </button>
                )}
            </div>
        </div>
    );
};

export default CalendarHeader;
