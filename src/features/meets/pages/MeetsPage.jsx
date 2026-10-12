import React, { useEffect, useState, useMemo } from "react";
import {
    Plus,
    Video,
    Calendar,
    ArrowRight,
    Search,
    X,
    Repeat,
    Radio,
    Clock,
    ArrowUpDown,
    Check,
} from "lucide-react";
import useMeetings from "../hooks/useMeetings";
import MeetingCard from "../components/MeetingCard";
import CreateMeetingDialog from "../components/CreateMeetingDialog";
import EditMeetingDialog from "../components/EditMeetingDialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import meetingService from "../services/meeting.service";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const MeetsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        meetings,
        loading,
        createDialogOpen,
        fetchMeetings,
        createMeeting,
        updateMeeting,
        cancelMeeting,
        endMeeting,
        joinByCode,
        toggleCreateDialog,
    } = useMeetings();

    const activeTab = searchParams.get("tab") || "upcoming"; // "upcoming" | "recurring" | "past" | "cancelled"
    const [joinInputCode, setJoinInputCode] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("scheduledAt");
    const [sortOrder, setSortOrder] = useState("asc");
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [createDialogInitialType, setCreateDialogInitialType] = useState("scheduled");

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    // Handle action parameters from sidebar links
    useEffect(() => {
        const action = searchParams.get("action");
        if (action === "schedule") {
            setCreateDialogInitialType("scheduled");
            toggleCreateDialog(true);
            const next = new URLSearchParams(searchParams);
            next.delete("action");
            setSearchParams(next, { replace: true });
        } else if (action === "recurring") {
            setCreateDialogInitialType("recurring");
            toggleCreateDialog(true);
            const next = new URLSearchParams(searchParams);
            next.delete("action");
            setSearchParams(next, { replace: true });
        } else if (action === "instant") {
            const next = new URLSearchParams(searchParams);
            next.delete("action");
            setSearchParams(next, { replace: true });
            handleInstantMeeting();
        }
    }, [searchParams]);

    const handleTabChange = (tab) => {
        const next = new URLSearchParams(searchParams);
        if (tab === "upcoming") {
            next.delete("tab");
        } else {
            next.set("tab", tab);
        }
        setSearchParams(next);
    };

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        if (!joinInputCode.trim()) return;
        try {
            const data = await joinByCode(joinInputCode.trim());
            if (data?.meeting?.joinCode) {
                navigate(`/meets/room/${data.meeting.joinCode}`);
            }
        } catch (_) {}
    };

    const handleCardJoin = async (code) => {
        try {
            await joinByCode(code);
            navigate(`/meets/room/${code}`);
        } catch (_) {}
    };

    const handleCreateMeeting = async (payload) => {
        const created = await createMeeting(payload);
        if (payload.type === "instant" && created?.joinCode) {
            navigate(`/meets/room/${created.joinCode}`);
        }
    };

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

    const ongoingMeetings = meetings.filter((m) => m.status === "ongoing");

    const handleEndAllOngoing = async () => {
        try {
            for (const m of ongoingMeetings) {
                try {
                    await meetingService.endMeeting(m._id);
                } catch (_) {}
            }
            await fetchMeetings();
        } catch (_) {}
    };

    const sortOptions = [
        { label: "Date: Soonest First", field: "scheduledAt", order: "asc" },
        { label: "Date: Latest First", field: "scheduledAt", order: "desc" },
        { label: "Title: A → Z", field: "title", order: "asc" },
        { label: "Title: Z → A", field: "title", order: "desc" },
    ];

    const currentSortLabel =
        sortOptions.find((o) => o.field === sortField && o.order === sortOrder)
            ?.label || "Sort";

    // Tab Counts
    const upcomingCount = meetings.filter(
        (m) => m.status === "scheduled" || m.status === "ongoing"
    ).length;
    const recurringCount = meetings.filter(
        (m) =>
            (m.status === "scheduled" || m.status === "ongoing") &&
            (m.type === "recurring" || (m.recurrenceType && m.recurrenceType !== "NONE"))
    ).length;
    const pastCount = meetings.filter((m) => m.status === "completed").length;
    const cancelledCount = meetings.filter((m) => m.status === "cancelled").length;

    // Filter & Sort
    const filteredMeetings = useMemo(() => {
        return meetings
            .filter((m) => {
                const matchesSearch =
                    !searchQuery.trim() ||
                    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.joinCode?.toLowerCase().includes(searchQuery.toLowerCase());

                if (!matchesSearch) return false;

                if (activeTab === "upcoming") {
                    return m.status === "scheduled" || m.status === "ongoing";
                }
                if (activeTab === "recurring") {
                    return (
                        (m.status === "scheduled" || m.status === "ongoing") &&
                        (m.type === "recurring" || (m.recurrenceType && m.recurrenceType !== "NONE"))
                    );
                }
                if (activeTab === "past") {
                    return m.status === "completed";
                }
                if (activeTab === "cancelled") {
                    return m.status === "cancelled";
                }
                return true;
            })
            .sort((a, b) => {
                if (sortField === "title") {
                    const comp = (a.title || "").localeCompare(b.title || "");
                    return sortOrder === "asc" ? comp : -comp;
                }
                // default: scheduledAt
                const tA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
                const tB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
                return sortOrder === "asc" ? tA - tB : tB - tA;
            });
    }, [meetings, activeTab, searchQuery, sortField, sortOrder]);

    const tabs = [
        { id: "upcoming", label: "Upcoming", count: upcomingCount },
        { id: "recurring", label: "Recurring", count: recurringCount, icon: Repeat },
        { id: "past", label: "Past", count: pastCount },
        { id: "cancelled", label: "Cancelled", count: cancelledCount },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-background p-5 sm:p-7 space-y-6">
            {/* 1. Top Bar: Title & Primary CTAs matching ProjectsDashboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                        Meets
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your team's video conferences, scheduled syncs, and recordings.
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                        onClick={handleInstantMeeting}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 py-1.5 transition-colors border border-border/60 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                        <Video className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Instant Meet</span>
                    </button>

                    <button
                        onClick={() => {
                            setCreateDialogInitialType(
                                activeTab === "recurring" ? "recurring" : "scheduled"
                            );
                            toggleCreateDialog(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 h-8 px-3.5 py-1.5 transition-colors cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>New Meeting</span>
                    </button>
                </div>
            </div>

            {/* 2. Fast Join & Live Alert Toolbar */}
            {ongoingMeetings.length > 0 ? (
                <div className="rounded-lg border border-status-live-border bg-status-live/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-3">
                        <span className="size-2 rounded-full bg-status-live-foreground animate-ping shrink-0" />
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-status-live-foreground">
                                    Live Meeting in Progress
                                </span>
                                {ongoingMeetings.length > 1 && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-background border border-border">
                                        +{ongoingMeetings.length - 1} more
                                    </span>
                                )}
                            </div>
                            <p className="text-foreground font-medium mt-0.5">
                                {ongoingMeetings[0].title}
                                <span className="text-muted-foreground font-mono ml-2">
                                    ({ongoingMeetings[0].joinCode})
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleCardJoin(ongoingMeetings[0].joinCode)}
                            className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground h-7 px-3 hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
                        >
                            <Video className="w-3 h-3" />
                            <span>Join Live</span>
                        </button>
                        <button
                            onClick={handleEndAllOngoing}
                            className="inline-flex items-center rounded-md text-xs font-medium border border-border bg-background text-destructive hover:bg-muted h-7 px-2.5 transition-colors cursor-pointer"
                        >
                            End Live
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card/60 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Radio className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Have an invite code? Connect directly to a room:</span>
                    </div>
                    <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={joinInputCode}
                            onChange={(e) => setJoinInputCode(e.target.value)}
                            placeholder="e.g. abc-defg-hij"
                            className="h-7 w-48 px-2.5 rounded-md border border-input bg-card font-mono text-xs uppercase placeholder:normal-case placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <button
                            type="submit"
                            disabled={!joinInputCode.trim()}
                            className="inline-flex items-center gap-1 rounded-md text-xs font-semibold bg-primary text-primary-foreground h-7 px-3 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                            <span>Join</span>
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    </form>
                </div>
            )}

            {/* 3. Filter & Search Bar matching ProjectsDashboard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search & Sort */}
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search meetings by title or code..."
                            className="w-full h-8 pl-8 pr-7 rounded-md border border-input bg-card text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-input bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 shadow-2xs cursor-pointer"
                                title="Sort Meetings"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{currentSortLabel}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 text-xs">
                            <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                Sort Meetings By
                            </DropdownMenuLabel>
                            {sortOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.label}
                                    onClick={() => {
                                        setSortField(opt.field);
                                        setSortOrder(opt.order);
                                    }}
                                    className="flex items-center justify-between cursor-pointer py-1.5"
                                >
                                    <span>{opt.label}</span>
                                    {sortField === opt.field && sortOrder === opt.order && (
                                        <Check className="w-3.5 h-3.5 text-primary" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Filter Tabs matching ProjectsDashboard */}
                <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-lg bg-muted/60 border border-border text-xs shrink-0">
                    {tabs.map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap text-xs cursor-pointer inline-flex items-center gap-1.5",
                                    isActive
                                        ? "bg-background text-foreground shadow-2xs font-semibold"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {TabIcon && <TabIcon className="w-3 h-3" />}
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-normal">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Content Area: Loading / Empty / Meetings Grid */}
            {loading && filteredMeetings.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-12 text-muted-foreground animate-pulse text-xs">
                    Loading meetings...
                </div>
            ) : filteredMeetings.length === 0 ? (
                /* Context-Specific Empty State matching ProjectsDashboard */
                <div className="flex flex-col items-center justify-center p-10 border border-dashed border-border rounded-lg bg-card/40 text-center">
                    <Calendar className="h-9 w-9 text-muted-foreground/60 mb-2" />
                    <h3 className="text-sm font-semibold text-foreground">
                        {searchQuery.trim()
                            ? `No meetings found for "${searchQuery}"`
                            : `No ${activeTab} meetings found`}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
                        {searchQuery.trim()
                            ? "Try adjusting your search terms or clearing the filter."
                            : activeTab === "upcoming"
                            ? "You don't have any upcoming meetings scheduled right now."
                            : activeTab === "recurring"
                            ? "You don't have any recurring or periodic meeting series set up."
                            : `There are no ${activeTab} meetings in your workspace.`}
                    </p>

                    {searchQuery.trim() ? (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground h-8 px-3 py-1 transition-colors cursor-pointer"
                        >
                            Clear search
                        </button>
                    ) : (
                        (activeTab === "upcoming" || activeTab === "recurring") && (
                            <button
                                onClick={() => {
                                    setCreateDialogInitialType(
                                        activeTab === "recurring" ? "recurring" : "scheduled"
                                    );
                                    toggleCreateDialog(true);
                                }}
                                className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3.5 py-1.5 transition-colors shadow-2xs gap-1.5 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>
                                    {activeTab === "recurring"
                                        ? "Schedule Recurring Series"
                                        : "Schedule Meeting"}
                                </span>
                            </button>
                        )
                    )}
                </div>
            ) : (
                /* Meetings Grid matching ProjectsDashboard */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMeetings.map((meeting) => (
                        <MeetingCard
                            key={meeting._id}
                            meeting={meeting}
                            onJoin={handleCardJoin}
                            onCancel={cancelMeeting}
                            onEnd={endMeeting}
                            onEdit={setEditingMeeting}
                        />
                    ))}
                </div>
            )}

            {/* Create Dialog Modal */}
            <CreateMeetingDialog
                isOpen={createDialogOpen}
                onClose={() => toggleCreateDialog(false)}
                onSubmit={handleCreateMeeting}
                loading={loading}
                initialType={createDialogInitialType}
            />

            {/* Edit / Reschedule Dialog Modal */}
            <EditMeetingDialog
                isOpen={Boolean(editingMeeting)}
                onClose={() => setEditingMeeting(null)}
                meeting={editingMeeting}
                onUpdate={updateMeeting}
                loading={loading}
            />
        </div>
    );
};

export default MeetsPage;
