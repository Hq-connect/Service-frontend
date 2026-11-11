import React, { useRef, useState, useEffect } from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Download,
    Calendar,
    Clock,
    User,
    FileVideo,
    Users,
    Share2,
    Lock,
    Shield,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { ShareRecordingSection } from "./ShareRecordingModal";

export const RecordingPlayerModal = ({
    recording,
    isOpen,
    onClose,
    onDelete,
    onUpdateRecording,
    initialView = "player",
}) => {
    const videoRef = useRef(null);
    const { currentUser, currentUserId } = useCurrentUser();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(recording?.duration || 0);
    const [activeView, setActiveView] = useState(initialView || "player");

    useEffect(() => {
        if (isOpen) {
            setIsPlaying(false);
            setCurrentTime(0);
            setActiveView(initialView || "player");
        }
    }, [isOpen, recording, initialView]);

    if (!recording) return null;

    const isOwner = Boolean(
        (currentUserId && String(recording?.recordedBy?._id || recording?.recordedBy) === String(currentUserId)) ||
        (recording?.meetingId && (
            String(
                recording.meetingId.hostId?._id ||
                recording.meetingId.hostId ||
                recording.meetingId.createdBy?._id ||
                recording.meetingId.createdBy ||
                recording.meetingId.managerId ||
                recording.meetingId.headId
            ) === String(currentUserId)
        )) ||
        currentUser?.role === "admin" ||
        currentUser?.role === "superadmin"
    );

    const sharedCount = Array.isArray(recording.sharedWith)
        ? recording.sharedWith.length
        : Array.isArray(recording.sharedUsers)
        ? recording.sharedUsers.length
        : 0;

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current && videoRef.current.duration) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const formatSeconds = (sec = 0) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const formatFileSize = (bytes = 0) => {
        if (!bytes) return "Unknown size";
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-border bg-card text-card-foreground">
                {/* Header */}
                <DialogHeader className="p-4 border-b border-border bg-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <FileVideo className="size-4" />
                            </div>
                            <div className="min-w-0 text-left">
                                <DialogTitle className="text-sm font-semibold text-foreground truncate font-heading">
                                    {recording.title}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{formatFileSize(recording.fileSize)}</span>
                                    <span>•</span>
                                    {sharedCount > 0 ? (
                                        <span className="text-primary font-medium flex items-center gap-1">
                                            <Users className="size-3" />
                                            Shared with {sharedCount} {sharedCount === 1 ? "member" : "members"}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <Lock className="size-3" />
                                            Private
                                        </span>
                                    )}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Actions & Tab Switcher */}
                        <div className="flex items-center gap-2 shrink-0">
                            {isOwner && (
                                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
                                    <button
                                        type="button"
                                        onClick={() => setActiveView("player")}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            activeView === "player"
                                                ? "bg-background text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <FileVideo className="size-3.5" />
                                        <span>Player</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveView("share")}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            activeView === "share"
                                                ? "bg-background text-foreground shadow-xs"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Users className="size-3.5" />
                                        <span>Share</span>
                                        {sharedCount > 0 ? (
                                            <span className="size-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold font-mono">
                                                {sharedCount}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground font-mono">0</span>
                                        )}
                                    </button>
                                </div>
                            )}

                            {!isOwner && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                                    <Users className="size-3" />
                                    Shared with you
                                </Badge>
                            )}

                            {recording.fileUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="gap-1.5 text-xs h-8"
                                    title="Download Recording"
                                >
                                    <a
                                        href={recording.fileUrl}
                                        download={`${recording.title || "recording"}.webm`}
                                    >
                                        <Download className="size-3.5" />
                                        <span className="hidden sm:inline">Download</span>
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* View Switcher: Player vs Share Section */}
                {activeView === "share" && isOwner ? (
                    <div className="p-5 max-h-[70vh] overflow-y-auto">
                        <ShareRecordingSection
                            recording={recording}
                            onShared={(updated) => {
                                if (onUpdateRecording) onUpdateRecording(updated);
                            }}
                            isEmbedded={false}
                        />
                    </div>
                ) : (
                    <>
                        {/* Video Viewport */}
                        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                            {recording.fileUrl ? (
                                <video
                                    ref={videoRef}
                                    src={recording.fileUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onClick={togglePlay}
                                    className="w-full h-full object-contain cursor-pointer"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                                    <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                                        <FileVideo className="size-7" />
                                    </div>
                                    <p className="text-sm font-medium text-white">Recording Preview</p>
                                    <p className="text-xs text-zinc-500 max-w-sm mt-1">
                                        Recorded session metadata stored. The video file was captured locally.
                                    </p>
                                </div>
                            )}

                            {/* Play/Pause Overlay Button if paused */}
                            {recording.fileUrl && !isPlaying && (
                                <button
                                    onClick={togglePlay}
                                    className="absolute p-4 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-2xl backdrop-blur-sm transition-transform active:scale-95 cursor-pointer"
                                >
                                    <Play className="size-6 fill-current translate-x-0.5" />
                                </button>
                            )}
                        </div>

                        {/* Player Controls Bar */}
                        {recording.fileUrl && (
                            <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex flex-col gap-2">
                                {/* Timeline Slider */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-mono text-muted-foreground min-w-[36px]">
                                        {formatSeconds(currentTime)}
                                    </span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 100}
                                        step={0.1}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-1.5 rounded-lg bg-muted accent-primary cursor-pointer"
                                    />
                                    <span className="text-[11px] font-mono text-muted-foreground min-w-[36px]">
                                        {formatSeconds(duration)}
                                    </span>
                                </div>

                                {/* Bottom Buttons */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={togglePlay}
                                            title={isPlaying ? "Pause" : "Play"}
                                        >
                                            {isPlaying ? (
                                                <Pause className="size-4" />
                                            ) : (
                                                <Play className="size-4 fill-current" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={toggleMute}
                                            title={isMuted ? "Unmute" : "Mute"}
                                        >
                                            {isMuted ? (
                                                <VolumeX className="size-4" />
                                            ) : (
                                                <Volume2 className="size-4" />
                                            )}
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={handleFullscreen}
                                        title="Fullscreen"
                                    >
                                        <Maximize className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Meta details footer */}
                <div className="px-4 py-3 bg-muted/50 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground/70" />
                            {recording.recorderName || "Host"}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground/70" />
                            Duration: {formatSeconds(recording.duration)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-muted-foreground/70" />
                            {new Date(recording.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>

                        {isOwner && activeView === "player" && (
                            <button
                                type="button"
                                onClick={() => setActiveView("share")}
                                className="text-primary hover:underline text-xs flex items-center gap-1 font-medium"
                            >
                                <Share2 className="size-3" />
                                {sharedCount > 0 ? `Shared with ${sharedCount} members` : "Share with workspace members"}
                            </button>
                        )}
                    </div>

                    {onDelete && isOwner && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete this recorded session?")) {
                                    onDelete(recording._id);
                                    onClose();
                                }
                            }}
                            className="text-destructive hover:bg-destructive/10 text-xs h-7 px-2"
                        >
                            Delete Recording
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RecordingPlayerModal;
