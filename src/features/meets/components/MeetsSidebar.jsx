import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Video,
    Calendar,
    Repeat,
    PlayCircle,
    Plus,
    Clock,
    Radio,
    ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useMeetings from "../hooks/useMeetings";

export const MeetsSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { meetings, createMeeting, toggleCreateDialog } = useMeetings();

    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get("tab") || "upcoming";
    const pathname = location.pathname;

    const handleInstantMeeting = async () => {
        try {
            const created = await createMeeting({
                title: "Instant Meeting",
                type: "instant",
                duration: 45,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            });
            if (created?.joinCode) {
                navigate(`/meets/room/${created.joinCode}`);
            }
        } catch (_) {}
    };

    const upcomingMeetings = meetings
        .filter((m) => m.status === "scheduled" || m.status === "ongoing")
        .slice(0, 5);

    const isAllMeetingsActive = pathname === "/meets" && activeTab === "upcoming";
    const isRecurringActive = pathname === "/meets" && activeTab === "recurring";
    const isPastActive = pathname === "/meets" && activeTab === "past";
    const isRecordingsActive = pathname.startsWith("/meets/recordings");
    const isCalendarActive = pathname.startsWith("/calendar");

    const navItemClass = (isActive) =>
        cn(
            "relative flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-colors",
            isActive
                ? "bg-muted text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-primary-sidebar-marker"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        );

    return (
        <div className="flex flex-col h-full overflow-hidden text-sidebar-foreground select-none">
            {/* Header */}
            <div className="px-3.5 py-3 border-b border-sidebar-border flex items-center justify-between">
                <div>
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Meets & Calendar
                    </h3>
                    <p className="text-[11px] text-foreground font-medium">
                        Rooms & Conferencing
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => toggleCreateDialog(true)}
                    className="size-7 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
                    title="Schedule New Meeting"
                >
                    <Plus className="size-3.5" />
                </button>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
                {/* 1. Main Views */}
                <div className="space-y-1">
                    <div className="px-2.5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Views
                    </div>
                    <Link
                        to="/meets?tab=upcoming"
                        className={navItemClass(isAllMeetingsActive)}
                    >
                        <Video className="size-4 shrink-0" />
                        <span>Upcoming & Live</span>
                    </Link>

                    <Link
                        to="/calendar"
                        className={navItemClass(isCalendarActive)}
                    >
                        <Calendar className="size-4 shrink-0" />
                        <span>Calendar Schedule</span>
                    </Link>

                    <Link
                        to="/meets?tab=recurring"
                        className={navItemClass(isRecurringActive)}
                    >
                        <Repeat className="size-4 shrink-0" />
                        <span>Recurring Series</span>
                    </Link>

                    <Link
                        to="/meets?tab=past"
                        className={navItemClass(isPastActive)}
                    >
                        <Clock className="size-4 shrink-0" />
                        <span>Past Meetings</span>
                    </Link>

                    <Link
                        to="/meets/recordings"
                        className={navItemClass(isRecordingsActive)}
                    >
                        <PlayCircle className="size-4 shrink-0" />
                        <span>Recorded Sessions</span>
                    </Link>
                </div>

                {/* 2. Quick Action */}
                <div className="space-y-1">
                    <div className="px-2.5 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Quick Launch
                    </div>
                    <button
                        type="button"
                        onClick={handleInstantMeeting}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg bg-muted/50 hover:bg-muted text-foreground border border-border/70 transition-colors group cursor-pointer shadow-2xs"
                    >
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-status-live-foreground animate-pulse" />
                            <span>Start Instant Room</span>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* 3. Upcoming Schedule Quick List */}
                <div className="space-y-1">
                    <div className="px-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Up Next</span>
                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                            {upcomingMeetings.length}
                        </span>
                    </div>

                    {upcomingMeetings.length === 0 ? (
                        <div className="px-2.5 py-3 text-xs text-muted-foreground">
                            No upcoming meetings
                        </div>
                    ) : (
                        upcomingMeetings.map((m) => {
                            const isOngoing = m.status === "ongoing";
                            const dateObj = m.scheduledAt ? new Date(m.scheduledAt) : null;
                            const timeStr =
                                dateObj && !isNaN(dateObj.getTime())
                                    ? dateObj.toLocaleTimeString("en-US", {
                                          hour: "numeric",
                                          minute: "2-digit",
                                          hour12: true,
                                      })
                                    : "Instant";

                            return (
                                <button
                                    key={m._id}
                                    type="button"
                                    onClick={() => navigate(`/meets/room/${m.joinCode}`)}
                                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors group text-left cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                        {isOngoing ? (
                                            <span className="size-2 rounded-full bg-status-live-foreground animate-pulse shrink-0" />
                                        ) : (
                                            <Radio className="size-3.5 text-muted-foreground shrink-0" />
                                        )}
                                        <span className="truncate text-foreground">
                                            {m.title}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono tabular-nums shrink-0 text-muted-foreground">
                                        {isOngoing ? "Live" : timeStr}
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetsSidebar;
