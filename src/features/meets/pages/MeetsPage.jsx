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
    ArrowUpDown,
    Check,
} from "lucide-react";
import useMeetings from "../hooks/useMeetings";
import MeetingCard from "../components/MeetingCard";
import CreateMeetingDialog from "../components/CreateMeetingDialog";
import EditMeetingDialog from "../components/EditMeetingDialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import meetingService from "../services/meeting.service";
import { Button } from "@/components/ui/button";
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

    const activeTab = searchParams.get("tab") || "upcoming";
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

    const kpis = [
        {
            label: "Upcoming & live",
            value: upcomingCount,
            sub: ongoingMeetings.length > 0 ? `${ongoingMeetings.length} active now` : "Scheduled rooms",
            live: ongoingMeetings.length > 0,
        },
        {
            label: "Recurring series",
            value: recurringCount,
            sub: "Periodic syncs",
        },
        {
            label: "Completed sessions",
            value: pastCount,
            sub: "Past meetings",
        },
        {
            label: "Cancelled",
            value: cancelledCount,
            sub: "Archived",
        },
    ];

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
        <div className="flex-1 overflow-y-auto bg-background p-5 sm:p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                {/* 1. Top Bar: Title & Primary CTAs (Matches Settings & ProjectsDashboard) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold text-foreground tracking-tight">
                            Meets & Video Rooms
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Host low-latency team video conferences, recurring standups, and recorded sessions.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleInstantMeeting}
                            disabled={loading}
                            className="gap-1.5 text-xs h-8 cursor-pointer"
                        >
                            <span className="size-2 rounded-full bg-status-live-foreground" />
                            <span>Instant Meet</span>
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => {
                                setCreateDialogInitialType(
                                    activeTab === "recurring" ? "recurring" : "scheduled"
                                );
                                toggleCreateDialog(true);
                            }}
                            className="gap-1.5 text-xs h-8 cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Schedule Meeting</span>
                        </Button>
                    </div>
                </div>

                {/* 2. KPI Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)"
                        >
                            <p className="text-[11px] font-medium text-muted-foreground">
                                {kpi.label}
                            </p>
                            <div className="mt-1 flex items-baseline justify-between gap-2">
                                <p className="text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                                    {kpi.value}
                                </p>
                                <span
                                    className={cn(
                                        "text-[10px] truncate flex items-center gap-1",
                                        kpi.live ? "text-status-live-foreground font-medium" : "text-muted-foreground"
                                    )}
                                >
                                    {kpi.live && (
                                        <span className="size-1.5 rounded-full bg-status-live-foreground animate-pulse" />
                                    )}
                                    {kpi.sub}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Fast Join & Live Alert Bar */}
                {ongoingMeetings.length > 0 ? (
                    <div className="rounded-xl border border-status-live-border bg-status-live/45 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-(--shadow-card)">
                        <div className="flex items-center gap-3">
                            <span className="size-2.5 rounded-full bg-status-live-foreground animate-ping shrink-0" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-status-live-foreground">
                                        Live Meeting in Progress
                                    </span>
                                    {ongoingMeetings.length > 1 && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-background border border-border">
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
                            <Button
                                size="xs"
                                onClick={() => handleCardJoin(ongoingMeetings[0].joinCode)}
                                className="gap-1.5 cursor-pointer"
                            >
                                <Video className="size-3" />
                                <span>Join Live Room</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="xs"
                                onClick={handleEndAllOngoing}
                                className="text-destructive hover:text-destructive cursor-pointer"
                            >
                                End Live
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-(--shadow-card)">
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                            <div className="size-7 rounded-lg bg-muted/70 border border-border flex items-center justify-center text-foreground shrink-0">
                                <Radio className="size-3.5" />
                            </div>
                            <div>
                                <span className="font-medium text-foreground">Direct Room Connect</span>
                                <span className="hidden sm:inline text-muted-foreground ml-1.5">
                                    — Enter a meeting invite code to join immediately
                                </span>
                            </div>
                        </div>
                        <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={joinInputCode}
                                onChange={(e) => setJoinInputCode(e.target.value)}
                                placeholder="e.g. abc-defg-hij"
                                className="h-8 w-44 sm:w-52 px-3 rounded-lg border border-input bg-background font-mono text-xs uppercase placeholder:normal-case placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!joinInputCode.trim()}
                                className="h-8 gap-1 text-xs cursor-pointer"
                            >
                                <span>Connect</span>
                                <ArrowRight className="size-3" />
                            </Button>
                        </form>
                    </div>
                )}

                {/* 4. Filter & Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search & Sort */}
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search meetings by title or code…"
                                className="w-full h-8 pl-8 pr-7 rounded-lg border border-input bg-card text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-input bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 shadow-2xs cursor-pointer"
                                title="Sort Meetings"
                            >
                                <ArrowUpDown className="size-3.5" />
                                <span className="hidden sm:inline">{currentSortLabel}</span>
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
                                            <Check className="size-3.5 text-primary" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto p-0.5 rounded-lg bg-muted/60 border border-border text-xs shrink-0">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap text-xs cursor-pointer inline-flex items-center gap-1.5",
                                        isActive
                                            ? "bg-background text-foreground shadow-2xs font-semibold"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {TabIcon && <TabIcon className="size-3" />}
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums bg-muted font-normal">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 5. Content Area: Layout-Accurate Skeletons / Empty State / Meetings Grid */}
                {loading && filteredMeetings.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div
                                key={n}
                                className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden"
                            >
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                                        <div className="size-6 rounded bg-muted animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-muted animate-pulse shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3.5 w-36 rounded bg-muted animate-pulse" />
                                            <div className="h-2.5 w-24 rounded bg-muted/60 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
                                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                                    <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredMeetings.length === 0 ? (
                    /* Architectural Empty State */
                    <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-border rounded-xl bg-card/50 text-center shadow-(--shadow-card)">
                        <div className="size-11 rounded-xl bg-muted/70 border border-border flex items-center justify-center mb-3 shadow-2xs">
                            <Calendar className="size-5 text-muted-foreground" />
                        </div>
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
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery("")}
                                className="h-8 text-xs cursor-pointer"
                            >
                                Clear search
                            </Button>
                        ) : (
                            (activeTab === "upcoming" || activeTab === "recurring") && (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setCreateDialogInitialType(
                                            activeTab === "recurring" ? "recurring" : "scheduled"
                                        );
                                        toggleCreateDialog(true);
                                    }}
                                    className="h-8 text-xs gap-1.5 cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    <span>
                                        {activeTab === "recurring"
                                            ? "Schedule Recurring Series"
                                            : "Schedule Meeting"}
                                    </span>
                                </Button>
                            )
                        )}
                    </div>
                ) : (
                    /* Meetings Grid */
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
        </div>
    );
};

export default MeetsPage;
