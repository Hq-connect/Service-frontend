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

    // Calculate upcoming/live meetings for the sidebar quick list
    const upcomingMeetings = meetings
        .filter((m) => m.status === "scheduled" || m.status === "ongoing")
        .slice(0, 5);

    const isAllMeetingsActive = pathname === "/meets" && activeTab === "upcoming";
    const isRecurringActive = pathname === "/meets" && activeTab === "recurring";
    const isPastActive = pathname === "/meets" && activeTab === "past";
    const isRecordingsActive = pathname.startsWith("/meets/recordings");
    const isCalendarActive = pathname.startsWith("/calendar");

    return (
        <div className="flex flex-col h-full overflow-hidden text-sidebar-foreground">
            {/* Header: Matches ProductivitySidebar header */}
            <div className="p-3 border-b border-sidebar-border flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Meets
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                        Rooms & Conferencing
                    </p>
                </div>
                <button
                    onClick={() => toggleCreateDialog(true)}
                    className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
                    title="Schedule New Meeting"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {/* 1. Main Views */}
                <div>
                    <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Views
                    </div>
                    <div className="mt-1 space-y-0.5">
                        <Link
                            to="/meets?tab=upcoming"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                isAllMeetingsActive
                                    ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <Video className="w-4 h-4 shrink-0" />
                            <span>Upcoming & Live</span>
                        </Link>

                        <Link
                            to="/calendar"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                isCalendarActive
                                    ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <Calendar className="w-4 h-4 shrink-0 text-primary" />
                            <span>Calendar View</span>
                        </Link>

                        <Link
                            to="/meets?tab=recurring"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                isRecurringActive
                                    ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <Repeat className="w-4 h-4 shrink-0" />
                            <span>Recurring Series</span>
                        </Link>

                        <Link
                            to="/meets?tab=past"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                isPastActive
                                    ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>Past Meetings</span>
                        </Link>

                        <Link
                            to="/meets/recordings"
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                isRecordingsActive
                                    ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <PlayCircle className="w-4 h-4 shrink-0" />
                            <span>Recorded Sessions</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Quick Action */}
                <div>
                    <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Quick Launch
                    </div>
                    <div className="mt-1">
                        <button
                            onClick={handleInstantMeeting}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md bg-muted/40 hover:bg-muted text-foreground border border-sidebar-border transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Instant Room</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* 3. Upcoming Schedule Quick List */}
                <div>
                    <div className="px-3 py-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Upcoming</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                            {upcomingMeetings.length}
                        </span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                        {upcomingMeetings.length === 0 ? (
                            <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                                No upcoming meetings
                            </div>
                        ) : (
                            upcomingMeetings.map((m) => {
                                const isOngoing = m.status === "ongoing";
                                const dateObj = m.scheduledAt ? new Date(m.scheduledAt) : null;
                                const timeStr = dateObj && !isNaN(dateObj.getTime())
                                    ? dateObj.toLocaleTimeString("en-US", {
                                          hour: "numeric",
                                          minute: "2-digit",
                                          hour12: true,
                                      })
                                    : "Instant";

                                return (
                                    <button
                                        key={m._id}
                                        onClick={() => navigate(`/meets/room/${m.joinCode}`)}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors group text-left cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                            {isOngoing ? (
                                                <span className="size-2 rounded-full bg-status-live-foreground animate-pulse shrink-0" />
                                            ) : (
                                                <Radio className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            )}
                                            <span className="truncate text-foreground group-hover:text-primary transition-colors">
                                                {m.title}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono shrink-0 text-muted-foreground">
                                            {isOngoing ? "Live" : timeStr}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetsSidebar;
