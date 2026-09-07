import React, { useEffect, useState } from "react";
import { Plus, Video, Calendar, Clock, ArrowRight, Search, RefreshCw } from "lucide-react";
import useMeetings from "../hooks/useMeetings";
import MeetingCard from "../components/MeetingCard";
import CreateMeetingDialog from "../components/CreateMeetingDialog";
import { useNavigate } from "react-router-dom";

export const MeetsPage = () => {
    const navigate = useNavigate();
    const {
        meetings,
        loading,
        createDialogOpen,
        fetchMeetings,
        createMeeting,
        cancelMeeting,
        joinByCode,
        toggleCreateDialog,
    } = useMeetings();

    const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" | "past" | "cancelled"
    const [joinInputCode, setJoinInputCode] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        if (!joinInputCode.trim()) return;
        try {
            const data = await joinByCode(joinInputCode.trim());
            if (data?.meeting?.joinCode) {
                // Navigate to meeting room if available
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-10 space-y-8">
            {/* Top Bar / Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                            <Video className="w-6 h-6" />
                        </span>
                        HQ Meetings
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Schedule, join, and manage team video sessions effortlessly.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchMeetings()}
                        disabled={loading}
                        className="p-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                        title="Refresh meetings"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>

                    <button
                        onClick={() => toggleCreateDialog(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        New Meeting
                    </button>
                </div>
            </div>

            {/* Quick Join Banner */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-indigo-950/40 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-1 text-center md:text-left">
                    <h2 className="text-lg font-semibold text-white">Join a Meeting with Code</h2>
                    <p className="text-xs text-zinc-400">
                        Got a join code from a colleague? Enter it below to join instantly.
                    </p>
                </div>

                <form onSubmit={handleJoinSubmit} className="flex items-center gap-2.5 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            value={joinInputCode}
                            onChange={(e) => setJoinInputCode(e.target.value)}
                            placeholder="e.g. abc-defg-hij"
                            className="w-full px-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!joinInputCode.trim() || loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white text-sm font-semibold transition-all disabled:opacity-40"
                    >
                        Join
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === "upcoming"
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        Upcoming & Live
                    </button>
                    <button
                        onClick={() => setActiveTab("past")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === "past"
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        Past
                    </button>
                    <button
                        onClick={() => setActiveTab("cancelled")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            activeTab === "cancelled"
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200"
                        }`}
                    >
                        Cancelled
                    </button>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search meetings..."
                        className="w-full pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
                    />
                </div>
            </div>

            {/* Meetings Grid */}
            {loading && filteredMeetings.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((n) => (
                        <div
                            key={n}
                            className="h-48 rounded-xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse p-5"
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
                        />
                    ))}
                </div>
            ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-4">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-200">No {activeTab} meetings</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-5">
                        {activeTab === "upcoming"
                            ? "You don't have any upcoming meetings scheduled right now."
                            : `There are no ${activeTab} meetings in your history.`}
                    </p>
                    {activeTab === "upcoming" && (
                        <button
                            onClick={() => toggleCreateDialog(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Schedule your first meeting
                        </button>
                    )}
                </div>
            )}

            {/* Create Dialog Modal */}
            <CreateMeetingDialog
                isOpen={createDialogOpen}
                onClose={() => toggleCreateDialog(false)}
                onSubmit={createMeeting}
                loading={loading}
            />
        </div>
    );
};

export default MeetsPage;
