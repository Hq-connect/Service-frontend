import React, { useEffect, useState } from "react";
import { Plus, Video, Calendar, ArrowRight, Search, RefreshCw, PlayCircle, Loader2 } from "lucide-react";
import useMeetings from "../hooks/useMeetings";
import MeetingCard from "../components/MeetingCard";
import CreateMeetingDialog from "../components/CreateMeetingDialog";
import EditMeetingDialog from "../components/EditMeetingDialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import meetingService from "../services/meeting.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

    const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "past" | "cancelled"
    const [joinInputCode, setJoinInputCode] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [editingMeeting, setEditingMeeting] = useState(null);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    // Handle action parameters from sidebar links (?action=schedule | ?action=instant)
    useEffect(() => {
        const action = searchParams.get("action");
        if (action === "schedule") {
            toggleCreateDialog(true);
            setSearchParams({}, { replace: true });
        } else if (action === "instant") {
            setSearchParams({}, { replace: true });
            handleInstantMeeting();
        }
    }, [searchParams]);

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        if (!joinInputCode.trim()) return;
        try {
            const data = await joinByCode(joinInputCode.trim());
            if (data?.meeting?.joinCode) {
                navigate(`/meets/room/${data.meeting.joinCode}`);
            }
        } catch (err) {
            // Error handled in hook toast
        }
    };

    const handleCardJoin = async (code) => {
        try {
            await joinByCode(code);
            navigate(`/meets/room/${code}`);
        } catch (err) {
            // Error handled in hook toast
        }
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
        } catch (err) {
            // handled in hook
        }
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

    // Filter meetings according to active tab & search query
    const filteredMeetings = meetings.filter((m) => {
        const matchesSearch =
            m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.joinCode?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === "upcoming") {
            return m.status === "scheduled" || m.status === "ongoing";
        }
        if (activeTab === "past") {
            return m.status === "completed";
        }
        if (activeTab === "cancelled") {
            return m.status === "cancelled";
        }
        return true;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            {/* Top Bar / Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 font-heading">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Video className="size-5" />
                        </span>
                        HQ Meetings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Schedule, join, and manage team video sessions effortlessly.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchMeetings()}
                        disabled={loading}
                        title="Refresh meetings"
                    >
                        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/meets/recordings")}
                        className="gap-2"
                        title="View Recorded Sessions"
                    >
                        <PlayCircle className="size-4 text-primary" />
                        <span className="hidden sm:inline">Recordings</span>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={handleInstantMeeting}
                        disabled={loading}
                        className="gap-2"
                    >
                        <Video className="size-4 text-emerald-500" />
                        <span className="hidden sm:inline">Instant Meet</span>
                    </Button>

                    <Button
                        onClick={() => toggleCreateDialog(true)}
                        className="gap-2"
                    >
                        <Plus className="size-4" />
                        <span>New Meeting</span>
                    </Button>
                </div>
            </div>

            {/* Quick Join Banner */}
            <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-5">
                    <div className="space-y-0.5 text-center md:text-left">
                        <h2 className="text-base font-semibold text-foreground">Join a Meeting with Code</h2>
                        <p className="text-xs text-muted-foreground">
                            Got a join code from a colleague? Enter it below to join directly.
                        </p>
                    </div>

                    <form onSubmit={handleJoinSubmit} className="flex items-center gap-2.5 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Input
                                type="text"
                                value={joinInputCode}
                                onChange={(e) => setJoinInputCode(e.target.value)}
                                placeholder="e.g. abc-defg-hij"
                                className="font-mono text-xs uppercase"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!joinInputCode.trim() || loading}
                            size="sm"
                            className="gap-1.5"
                        >
                            Join
                            <ArrowRight className="size-3.5" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="upcoming">Upcoming & Live</TabsTrigger>
                            <TabsTrigger value="past">Past</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {activeTab === "upcoming" && ongoingMeetings.length > 0 && (
                        <Button
                            variant="destructive"
                            size="xs"
                            onClick={handleEndAllOngoing}
                            className="ml-2 gap-1.5"
                            title="End and clear all ongoing meetings"
                        >
                            Clear All Live ({ongoingMeetings.length})
                        </Button>
                    )}
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search meetings..."
                        className="pl-8 text-xs"
                    />
                </div>
            </div>

            {/* Meetings Grid */}
            {loading && filteredMeetings.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((n) => (
                        <div
                            key={n}
                            className="h-44 rounded-xl bg-muted/50 border border-border animate-pulse p-5"
                        />
                    ))}
                </div>
            ) : filteredMeetings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
            ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-muted/20">
                    <div className="p-3.5 rounded-full bg-muted border border-border text-muted-foreground mb-3">
                        <Calendar className="size-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">No {activeTab} meetings</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                        {activeTab === "upcoming"
                            ? "You don't have any upcoming meetings scheduled right now."
                            : `There are no ${activeTab} meetings in your history.`}
                    </p>
                    {activeTab === "upcoming" && (
                        <Button
                            onClick={() => toggleCreateDialog(true)}
                            size="sm"
                            className="gap-2"
                        >
                            <Plus className="size-3.5" />
                            Schedule your first meeting
                        </Button>
                    )}
                </div>
            )}

            {/* Create Dialog Modal */}
            <CreateMeetingDialog
                isOpen={createDialogOpen}
                onClose={() => toggleCreateDialog(false)}
                onSubmit={handleCreateMeeting}
                loading={loading}
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
