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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();

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
            activeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
            badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
        },
        {
            key: "recurring",
            label: "Recurring",
            icon: Repeat,
            count: counts.recurring || 0,
            dotColor: "bg-indigo-500",
            activeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
            badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
        },
        {
            key: "events",
            label: "Events",
            icon: Sparkles,
            count: counts.events || 0,
            dotColor: "bg-amber-500",
            activeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
            badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        },
        {
            key: "notes",
            label: "Date Notes",
            icon: FileText,
            count: counts.notes || 0,
            dotColor: "bg-rose-500",
            activeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
            badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
        },
    ];

    return (
        <div className="flex flex-col gap-3 pb-3 border-b border-border select-none">
            {/* Top Bar: Title, Date Navigator, View Mode Switcher, Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left Area: Sleek Date Navigator */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Standalone Today button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="h-8 px-3 text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                        Today
                    </Button>

                    {/* Navigation Arrows Pair */}
                    <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5 shadow-2xs">
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={goToPrev}
                            className="size-7 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label="Previous period"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={goToNext}
                            className="size-7 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label="Next period"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>

                    {/* Period Title */}
                    <div className="flex items-center gap-2 ml-1">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading">
                            {getHeaderTitle()}
                        </h1>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-mono font-medium rounded bg-muted text-muted-foreground border border-border">
                            <Clock className="size-2.5 text-muted-foreground" />
                            {timezoneStr}
                        </span>
                    </div>
                </div>

                {/* Right Area: View Mode Switcher + Actions */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* Robust Segmented View Switcher matching ProjectsDashboard tabs */}
                    <div className="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border text-xs select-none">
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

                    {/* Action: Meets Hub Navigation */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/meets")}
                        className="gap-1.5 cursor-pointer text-xs h-8"
                        title="Return to Meets Hub"
                    >
                        <Video className="size-3.5 text-primary" />
                        <span className="hidden sm:inline">Meets Hub</span>
                    </Button>

                    {/* Action: Add Event */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpenCreateEvent}
                        className="gap-1.5 cursor-pointer text-xs h-8"
                    >
                        <Sparkles className="size-3.5 text-amber-500" />
                        <span>Add Event</span>
                    </Button>

                    {/* Action: Schedule Meet */}
                    <Button
                        size="sm"
                        onClick={onOpenCreateMeeting}
                        className="gap-1.5 cursor-pointer text-xs h-8 shadow-2xs"
                    >
                        <Plus className="size-3.5" />
                        <span>Schedule Meet</span>
                    </Button>

                    {/* Sidebar Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                        title={isSidebarOpen ? "Collapse agenda sidebar" : "Expand agenda sidebar"}
                    >
                        {isSidebarOpen ? (
                            <PanelRightClose className="size-4" />
                        ) : (
                            <PanelRightOpen className="size-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Bottom Bar: Modern Filter Layers with Dot Indicators matching workspace pattern */}
            <div className="flex items-center justify-between gap-2 pt-1 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1">
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
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer shadow-2xs",
                                    isActive
                                        ? cfg.activeClass
                                        : "bg-muted/20 text-muted-foreground/60 border-border hover:bg-muted/40 hover:text-muted-foreground"
                                )}
                            >
                                <span
                                    className={cn(
                                        "size-1.5 rounded-full transition-all",
                                        isActive ? cfg.dotColor : "bg-muted-foreground/40"
                                    )}
                                />
                                <Icon className={cn("size-3", isActive ? "opacity-100" : "opacity-50")} />
                                <span>{cfg.label}</span>
                                <span
                                    className={cn(
                                        "text-[10px] font-semibold px-1 rounded",
                                        isActive ? cfg.badgeClass : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {cfg.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
