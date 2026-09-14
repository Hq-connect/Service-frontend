import React, { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => navigate("/meets")}
                            title="Back to Meetings"
                        >
                            <ArrowLeft className="size-4" />
                        </Button>
                        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5 font-heading">
                            <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                <PlayCircle className="size-5" />
                            </span>
                            Recorded Sessions
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Review, download, and manage your team's recorded meetings.
                    </p>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-2.5">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Search recordings..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 text-xs"
                        />
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchRecordings}
                        title="Refresh list"
                        disabled={loading}
                    >
                        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="rounded-xl bg-muted/40 border border-border p-4 space-y-4 animate-pulse"
                        >
                            <div className="w-full aspect-video rounded-lg bg-muted" />
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted/70 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : recordings.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-muted/20 max-w-xl mx-auto my-12">
                    <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                        <Film className="size-7" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">No Recorded Sessions Yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                        When you host a meeting, click the "Record" button to capture the session. Completed recordings will automatically appear here.
                    </p>
                    <Button
                        onClick={() => navigate("/meets?action=instant")}
                        className="mt-5 gap-2"
                        size="sm"
                    >
                        <Video className="size-4" />
                        Start an Instant Meeting
                    </Button>
                </div>
            ) : (
                /* Recordings Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {recordings.map((rec) => (
                        <Card
                            key={rec._id}
                            className="group flex flex-col justify-between overflow-hidden border-border bg-card text-card-foreground hover:shadow-md transition-all duration-200"
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
                                        <div className="size-12 rounded-xl bg-background/80 border border-border flex items-center justify-center text-muted-foreground">
                                            <FileVideo className="size-6" />
                                        </div>
                                    )}

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                                        <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                            <PlayCircle className="size-6" />
                                        </div>
                                    </div>

                                    {/* Duration Badge */}
                                    <Badge
                                        variant="secondary"
                                        className="absolute bottom-2 right-2 font-mono text-[10px] bg-background/90 backdrop-blur-sm border-border"
                                    >
                                        {formatSeconds(rec.duration)}
                                    </Badge>
                                </div>

                                {/* Card Header / Body */}
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                        {rec.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="px-4 pb-3 space-y-1.5 text-xs text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="size-3 text-muted-foreground/70" />
                                            {new Date(rec.createdAt).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                        <span className="font-mono text-[11px]">
                                            {formatFileSize(rec.fileSize)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <User className="size-3 text-muted-foreground/70" />
                                        <span className="truncate">Recorded by {rec.recorderName || "Host"}</span>
                                    </div>
                                </CardContent>
                            </div>

                            {/* Card Footer Actions */}
                            <CardFooter className="p-3 border-t border-border flex items-center justify-between gap-2 bg-transparent">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePlay(rec)}
                                    className="flex-1 gap-1.5 text-xs"
                                >
                                    <PlayCircle className="size-3.5" />
                                    <span>Watch</span>
                                </Button>

                                {rec.fileUrl && (
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
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
                                    size="icon-sm"
                                    onClick={() => {
                                        if (window.confirm("Delete this recorded session?")) {
                                            handleDelete(rec._id);
                                        }
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                    title="Delete recording"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </CardFooter>
                        </Card>
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
    );
};

export default RecordedSessionsPage;
