import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    PlayCircle,
    Search,
    RefreshCw,
    Download,
    Trash2,
    Calendar,
    User,
    Video,
    FileVideo,
    ArrowLeft,
    Film,
} from "lucide-react";
import meetingService from "../services/meeting.service";
import RecordingPlayerModal from "../components/RecordingPlayerModal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const RecordedSessionsPage = () => {
    const navigate = useNavigate();
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRecording, setSelectedRecording] = useState(null);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);

    const fetchRecordings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await meetingService.getRecordings({ search: searchQuery });
            setRecordings(res?.data?.recordings || []);
        } catch (err) {
            console.error("Failed to fetch recordings:", err);
            toast.error("Failed to load recorded sessions");
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchRecordings();
    }, [fetchRecordings]);

    const handleDelete = async (recordingId) => {
        try {
            await meetingService.deleteRecording(recordingId);
            setRecordings((prev) => prev.filter((r) => r._id !== recordingId));
            toast.success("Recording deleted successfully");
        } catch (err) {
            console.error("Failed to delete recording:", err);
            toast.error("Failed to delete recording");
        }
    };

    const handlePlay = (rec) => {
        setSelectedRecording(rec);
        setIsPlayerOpen(true);
    };

    const formatSeconds = (sec = 0) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const formatFileSize = (bytes = 0) => {
        if (!bytes) return "0 KB";
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const totalSizeBytes = useMemo(
        () => recordings.reduce((acc, r) => acc + (r.fileSize || 0), 0),
        [recordings]
    );
    const totalDurationSec = useMemo(
        () => recordings.reduce((acc, r) => acc + (r.duration || 0), 0),
        [recordings]
    );

    return (
        <div className="flex-1 overflow-y-auto bg-background p-5 sm:p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                {/* Header (Matches Settings & MeetsPage) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => navigate("/meets")}
                                title="Back to Meetings"
                                className="cursor-pointer"
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">
                                Recorded Sessions
                            </h1>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Review, stream, and download archived video recordings from your workspace meetings.
                        </p>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search recordings…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 rounded-lg border border-input bg-card text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={fetchRecordings}
                            title="Refresh list"
                            disabled={loading}
                            className="cursor-pointer"
                        >
                            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Total recordings
                        </p>
                        <p className="mt-1 text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                            {recordings.length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Total recorded duration
                        </p>
                        <p className="mt-1 text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                            {formatSeconds(totalDurationSec)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)">
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Storage footprint
                        </p>
                        <p className="mt-1 text-xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                            {formatFileSize(totalSizeBytes)}
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="rounded-xl bg-card border border-border shadow-(--shadow-card) overflow-hidden"
                            >
                                <div className="w-full aspect-video bg-muted animate-pulse" />
                                <div className="p-4 space-y-2.5">
                                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                                    <div className="h-3 bg-muted/70 rounded w-1/2 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : recordings.length === 0 ? (
                    /* Architectural Empty State */
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-xl border border-dashed border-border bg-card/50 shadow-(--shadow-card)">
                        <div className="size-11 rounded-xl bg-muted/70 border border-border flex items-center justify-center text-muted-foreground mb-3 shadow-2xs">
                            <Film className="size-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                            No Recorded Sessions Yet
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                            When you host a meeting, click the &ldquo;Record&rdquo; control to capture the session. Completed recordings automatically appear here.
                        </p>
                        <Button
                            onClick={() => navigate("/meets?action=instant")}
                            className="mt-4 gap-1.5 h-8 text-xs cursor-pointer"
                            size="sm"
                        >
                            <Video className="size-3.5" />
                            Start an Instant Meeting
                        </Button>
                    </div>
                ) : (
                    /* Recordings Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recordings.map((rec) => (
                            <div
                                key={rec._id}
                                className="group flex flex-col justify-between rounded-xl overflow-hidden border border-border bg-card text-card-foreground shadow-(--shadow-card) hover:border-foreground/25 transition-all duration-150"
                            >
                                <div>
                                    {/* Card Video Preview / Thumbnail */}
                                    <div
                                        onClick={() => handlePlay(rec)}
                                        className="relative w-full aspect-video bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-b border-border"
                                    >
                                        {rec.fileUrl ? (
                                            <video
                                                src={rec.fileUrl}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                preload="metadata"
                                            />
                                        ) : (
                                            <div className="size-11 rounded-xl bg-background/80 border border-border flex items-center justify-center text-muted-foreground">
                                                <FileVideo className="size-5" />
                                            </div>
                                        )}

                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                            <div className="p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                <PlayCircle className="size-5" />
                                            </div>
                                        </div>

                                        {/* Duration Badge */}
                                        <Badge
                                            variant="secondary"
                                            className="absolute bottom-2 right-2 font-mono tabular-nums text-[10px] bg-background/90 backdrop-blur-sm border-border"
                                        >
                                            {formatSeconds(rec.duration)}
                                        </Badge>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 space-y-2">
                                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
                                            {rec.title}
                                        </h3>

                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            <div className="flex items-center justify-between font-mono tabular-nums text-[11px]">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="size-3 text-muted-foreground/70" />
                                                    {new Date(rec.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                                <span>{formatFileSize(rec.fileSize)}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[11px]">
                                                <User className="size-3 text-muted-foreground/70" />
                                                <span className="truncate">
                                                    Recorded by {rec.recorderName || "Host"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Architectural Card Footer */}
                                <div className="px-4 py-2.5 border-t border-border bg-muted/35 flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="xs"
                                        onClick={() => handlePlay(rec)}
                                        className="flex-1 gap-1.5 text-xs cursor-pointer"
                                    >
                                        <PlayCircle className="size-3.5" />
                                        <span>Watch Session</span>
                                    </Button>

                                    {rec.fileUrl && (
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            asChild
                                            title="Download recording"
                                        >
                                            <a
                                                href={rec.fileUrl}
                                                download={`${rec.title || "recording"}.webm`}
                                            >
                                                <Download className="size-3.5" />
                                            </a>
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() => {
                                            if (window.confirm("Delete this recorded session?")) {
                                                handleDelete(rec._id);
                                            }
                                        }}
                                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                                        title="Delete recording"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Playback Modal */}
                <RecordingPlayerModal
                    recording={selectedRecording}
                    isOpen={isPlayerOpen}
                    onClose={() => {
                        setIsPlayerOpen(false);
                        setSelectedRecording(null);
                    }}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
};

export default RecordedSessionsPage;
