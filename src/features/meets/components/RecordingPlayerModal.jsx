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

export const RecordingPlayerModal = ({ recording, isOpen, onClose, onDelete }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(recording?.duration || 0);

    useEffect(() => {
        if (isOpen) {
            setIsPlaying(false);
            setCurrentTime(0);
        }
    }, [isOpen, recording]);

    if (!recording) return null;

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
                    <div className="flex items-center justify-between gap-4 pr-6">
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
                                </DialogDescription>
                            </div>
                        </div>

                        {recording.fileUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="gap-1.5 text-xs"
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
                </DialogHeader>

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

                {/* Meta details footer */}
                <div className="px-4 py-3 bg-muted/50 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
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
                    </div>

                    {onDelete && (
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
