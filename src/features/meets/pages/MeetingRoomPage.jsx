import React, { useRef, useEffect, useState } from "react";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    PhoneOff,
    MessageSquare,
    Users,
    Copy,
    Share2,
    Shield,
    Clock,
    Check,
    Send,
    X,
    Maximize2,
    Minimize2,
    Radio,
    ChevronDown,
    UserPlus,
    CircleDot,
    Sparkles,
} from "lucide-react";
import useMeetingChat from "../hooks/useMeetingChat";
import MeetingChat from "../components/MeetingChat";
import ScreenShareIndicator from "../components/ScreenShareIndicator";
import LiveKitVideoStage from "../components/LiveKitVideoStage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const MeetingRoomPage = ({
    meeting,
    participants = [],
    user,
    isHost,
    // Media states
    isMuted,
    isVideoOff,
    isScreenSharing,
    remoteSharer,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    // State setters for LiveKit bidirectional sync
    setIsScreenSharing,
    setIsMuted,
    setIsVideoOff,
    // Recording states & actions
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    // LiveKit states
    livekitToken,
    livekitUrl,
    // Drawer states
    isChatOpen,
    isParticipantsOpen,
    toggleChat,
    toggleParticipants,
    elapsedTime,
    // Actions
    leaveRoom,
    endRoom,
    copyJoinCode,
    copyInviteUrl,
    tenantSlug,
}) => {
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [dismissInviteCard, setDismissInviteCard] = useState(false);
    const [livekitError, setLivekitError] = useState(null);

    // Detect mobile device for screen share guard
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Extract current user and ID robustly
    const currentUser = user?.data?.user || user?.user || user?.data || user;
    const currentUserId = currentUser?._id || currentUser?.id || user?._id || user?.id;
    const currentUserName =
        currentUser?.fullName ||
        currentUser?.name ||
        (currentUser?.firstName
            ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim()
            : "You");

    // Filter remote participants to exclude current user
    const remoteParticipants = participants.filter((p) => {
        const pUid = typeof p.userId === "object" ? (p.userId?._id || p.userId?.id) : p.userId;
        return pUid && currentUserId && String(pUid) !== String(currentUserId);
    });

    const totalParticipants = remoteParticipants.length + 1;

    // Helper for initials
    const getInitials = (name = "User") => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleCopyCode = () => {
        copyJoinCode();
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleCopyLink = () => {
        copyInviteUrl();
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    // In-meeting chat hook
    const { messages, sending, unreadCount, sendMessage } = useMeetingChat(
        meeting?._id,
        isChatOpen,
        currentUserName
    );

    /* -------------------------------------------------------------
       Tile Renderer Helper
       ------------------------------------------------------------- */
    const renderLocalTile = (isCompact = false) => (
        <div
            key="local-tile"
            className={`relative group w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl flex items-center justify-center transition-all ${
                isCompact ? "min-h-[100px]" : ""
            }`}
        >
            {/* Fallback: show avatar when LiveKit is not active */}
            <div className="flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                <div
                    className={`rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-xl shadow-indigo-600/25 border-2 border-indigo-400/30 ${
                        isCompact ? "w-10 h-10 text-sm" : "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl"
                    }`}
                >
                    {getInitials(currentUserName)}
                </div>
                {!isCompact && (
                    <span className="text-[11px] sm:text-xs text-zinc-400 font-medium tracking-wide">
                        {isVideoOff ? "Camera Off" : "Standalone Mode"}
                    </span>
                )}
            </div>

            {/* Local User Name & Status Badge */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 text-[11px] font-medium text-zinc-200">
                    <span className="truncate max-w-[120px]">{currentUserName} (You)</span>
                    {isHost && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                            Host
                        </span>
                    )}
                </div>

                <div
                    className={`p-1.5 rounded-lg backdrop-blur-md ${
                        isMuted
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-zinc-950/80 text-zinc-300 border border-zinc-800/80"
                    }`}
                >
                    {isMuted ? (
                        <MicOff className="w-3.5 h-3.5" />
                    ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                </div>
            </div>
        </div>
    );

    const renderRemoteTile = (p, idx, isCompact = false) => {
        const pName =
            p.userName ||
            p.userId?.fullName ||
            p.userId?.name ||
            (p.userId?.firstName ? `${p.userId.firstName} ${p.userId.lastName || ""}`.trim() : `Participant ${idx + 1}`);
        const pIsHost = p.role === "host";
        const pJoined = p.status === "joined";

        return (
            <div
                key={p._id || idx}
                className={`relative group w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border shadow-xl flex items-center justify-center transition-all ${
                    pJoined ? "border-zinc-800" : "border-zinc-800/40 opacity-60"
                } ${isCompact ? "min-h-[100px]" : ""}`}
            >
                <div className="flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                    <div
                        className={`rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-xl border-2 border-cyan-400/30 ${
                            isCompact ? "w-10 h-10 text-sm" : "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl"
                        }`}
                    >
                        {getInitials(pName)}
                    </div>
                    {!isCompact && (
                        <span className="text-[11px] sm:text-xs text-zinc-400 font-medium tracking-wide">
                            {pJoined ? "In Meeting" : "Left Room"}
                        </span>
                    )}
                </div>

                {/* Remote User Name & Status Badge */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 text-[11px] font-medium text-zinc-200">
                        <span className="truncate max-w-[120px]">{pName}</span>
                        {pIsHost && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                                Host
                            </span>
                        )}
                    </div>

                    <div className="p-1.5 rounded-lg backdrop-blur-md bg-zinc-950/80 text-zinc-400 border border-zinc-800/80">
                        <Mic className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative flex flex-col h-screen h-[100dvh] w-full max-w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
            {/* -------------------------------------------------------------
               1. TOP HEADER (Always docked, never scrolls off)
               ------------------------------------------------------------- */}
            <header className="shrink-0 h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md z-30">
                {/* Left: Live Indicator, Title & Timer */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 uppercase font-bold text-[10px] tracking-wider">
                        <Radio className="size-3 text-emerald-400 animate-pulse" />
                        Live
                    </Badge>

                    {isRecording && (
                        <Badge variant="outline" className="bg-red-500/15 text-red-400 border-red-500/30 gap-1.5 font-mono text-[10px] font-semibold animate-pulse">
                            <span className="size-2 rounded-full bg-red-500" />
                            <span>REC {recordingDuration}</span>
                        </Badge>
                    )}

                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                            {meeting?.title || "Instant Meeting"}
                        </h1>
                        <Badge variant="outline" className="hidden sm:inline-flex gap-1 font-mono text-[11px] text-zinc-300 border-zinc-800 bg-zinc-900/80">
                            <Clock className="size-3 text-zinc-400" />
                            {elapsedTime}
                        </Badge>
                    </div>

                    {livekitToken && !livekitError && (
                        <Badge variant="outline" className="hidden md:inline-flex bg-cyan-500/10 text-cyan-400 border-cyan-500/30 gap-1 text-[10px] font-semibold">
                            <Sparkles className="size-3 text-cyan-400" />
                            LiveKit SFU
                        </Badge>
                    )}

                    <ScreenShareIndicator
                        isSharing={isScreenSharing || Boolean(remoteSharer)}
                        isSelf={isScreenSharing}
                        sharerName={remoteSharer?.userName || "Participant"}
                        onStopShare={toggleScreenShare}
                    />
                </div>

                {/* Right: Prominent Invite Link & Fullscreen */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {/* Primary "Invite" / Copy Link Button */}
                    <Button
                        size="sm"
                        onClick={handleCopyLink}
                        className="gap-1.5 text-xs font-semibold"
                        title="Copy Meeting Invite Link (includes workspace credentials)"
                    >
                        {copiedLink ? (
                            <Check className="size-3.5 text-emerald-300" />
                        ) : (
                            <Share2 className="size-3.5" />
                        )}
                        <span>{copiedLink ? "Link Copied!" : "Invite Link"}</span>
                    </Button>

                    {/* Join Code Pill */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyCode}
                        className="hidden md:inline-flex gap-1.5 text-xs font-mono border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-850"
                        title="Copy meeting join code"
                    >
                        {copiedCode ? (
                            <Check className="size-3.5 text-emerald-400" />
                        ) : (
                            <Copy className="size-3.5 text-zinc-400" />
                        )}
                        <span>{meeting?.joinCode}</span>
                    </Button>

                    {/* Fullscreen Toggle */}
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={toggleFullscreen}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="size-4" />
                        ) : (
                            <Maximize2 className="size-4" />
                        )}
                    </Button>
                </div>
            </header>

            {/* -------------------------------------------------------------
               2. MAIN VIEWPORT (Video stage + Responsive Drawer)
               ------------------------------------------------------------- */}
            <div className="flex-1 flex min-h-0 min-w-0 w-full overflow-hidden relative">
                {/* Center Stage: Video Grid / Screen Share */}
                <main className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 overflow-hidden min-h-0 min-w-0 relative justify-center items-center">
                    {/* Google Meet Style "Meeting is ready" Floating Card (When Alone) */}
                    {remoteParticipants.length === 0 && !dismissInviteCard && (
                        <Card className="absolute top-3 left-3 sm:top-5 sm:left-5 max-w-xs sm:max-w-sm bg-card/95 backdrop-blur-xl border-border text-card-foreground p-4 shadow-2xl z-20">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 text-primary">
                                    <Users className="size-4" />
                                    <h4 className="text-xs font-semibold text-foreground">
                                        Your meeting is ready
                                    </h4>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setDismissInviteCard(true)}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Dismiss"
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>

                            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                                Share this link with others to join. You can open an incognito or private window to test the meeting simultaneously!
                            </p>

                            <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleCopyLink}
                                    className="flex-1 gap-1.5 text-xs font-semibold"
                                >
                                    {copiedLink ? (
                                        <Check className="size-3.5 text-emerald-300" />
                                    ) : (
                                        <Copy className="size-3.5" />
                                    )}
                                    <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyCode}
                                    className="text-xs font-mono"
                                    title="Copy Code"
                                >
                                    {copiedCode ? (
                                        <Check className="size-3 text-emerald-500" />
                                    ) : (
                                        <span className="font-semibold">{meeting?.joinCode}</span>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* LIVEKIT REAL-TIME MULTI-PARTY MEDIA STAGE */}
                    {livekitToken && livekitUrl && !livekitError ? (
                        <LiveKitVideoStage
                            serverUrl={livekitUrl}
                            token={livekitToken}
                            hostUserId={meeting?.createdBy?._id || meeting?.createdBy || currentUserId}
                            isMuted={isMuted}
                            isVideoOff={isVideoOff}
                            isScreenSharing={isScreenSharing}
                            setIsScreenSharing={setIsScreenSharing}
                            dbParticipants={participants}
                            onError={(err) => {
                                console.warn("LiveKit connection issue, using fallback stage:", err);
                                setLivekitError(err.message || "LiveKit connection failed");
                            }}
                        />
                    ) : (
                        /* FALLBACK STANDALONE STAGE (When LiveKit not configured or offline) */
                        <>
                            {/* Status Banner when in Standalone/Preview Mode */}
                            {!livekitToken && (
                                <div className="shrink-0 mb-3 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2 max-w-xl mx-auto shadow-sm">
                                    <Sparkles className="size-3.5 text-indigo-400 shrink-0" />
                                    <span className="truncate">
                                        Standalone Media Mode active. Add LiveKit API keys to .env to enable multi-peer SFU video.
                                    </span>
                                </div>
                            )}

                            {/* A. SCREEN SHARING MODE */}
                            {(isScreenSharing || remoteSharer) ? (
                                <div className="flex-1 flex flex-col w-full h-full min-h-0 items-center justify-center gap-3">
                            {/* Dominant Screen Share Stage */}
                            <div className="flex-1 min-h-0 w-full rounded-2xl overflow-hidden bg-black border border-indigo-500/40 shadow-2xl flex items-center justify-center relative">
                                {isScreenSharing ? (
                                    <div className="flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 animate-pulse">
                                            <MonitorUp className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-base font-semibold text-white">
                                            You are presenting
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                                            Screen sharing active.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 animate-pulse">
                                            <MonitorUp className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-base font-semibold text-white">
                                            {remoteSharer?.userName || "A participant"} is presenting
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                                            Live screen broadcast active.
                                        </p>
                                    </div>
                                )}

                                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-indigo-600/80 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                                    <MonitorUp className="w-3.5 h-3.5" />
                                    <span>
                                        {isScreenSharing ? "You are presenting" : `${remoteSharer?.userName || "User"} presenting`}
                                    </span>
                                </div>
                            </div>

                            {/* Participant Filmstrip (Compact horizontal row) */}
                            <div className="shrink-0 h-24 sm:h-28 w-full flex items-center justify-center gap-3 overflow-x-auto py-1 px-2">
                                <div className="h-full aspect-video shrink-0">
                                    {renderLocalTile(true)}
                                </div>
                                {remoteParticipants.map((p, idx) => (
                                    <div key={p._id || idx} className="h-full aspect-video shrink-0">
                                        {renderRemoteTile(p, idx, true)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* B. DYNAMIC AUTO-FITTING GRID (Zero Scrollbars) */
                        <div className="w-full h-full min-h-0 flex items-center justify-center">
                            {/* 1 Participant: Single Large Center Stage */}
                            {totalParticipants === 1 && (
                                <div className="w-full h-full flex items-center justify-center p-1 sm:p-2">
                                    <div className="w-full max-w-4xl h-full max-h-[72vh] aspect-[4/3] sm:aspect-video">
                                        {renderLocalTile()}
                                    </div>
                                </div>
                            )}

                            {/* 2 Participants: Side-by-Side on Desktop, Stacked on Mobile */}
                            {totalParticipants === 2 && (
                                <div className="w-full h-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 p-1 sm:p-2">
                                    <div className="flex-1 w-full h-full max-h-[38vh] md:max-h-[70vh] aspect-video">
                                        {renderLocalTile()}
                                    </div>
                                    <div className="flex-1 w-full h-full max-h-[38vh] md:max-h-[70vh] aspect-video">
                                        {renderRemoteTile(remoteParticipants[0], 0)}
                                    </div>
                                </div>
                            )}

                            {/* 3 or 4 Participants: 2x2 Responsive Grid */}
                            {(totalParticipants === 3 || totalParticipants === 4) && (
                                <div className="w-full h-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center justify-center p-1 sm:p-2">
                                    <div className="w-full h-full max-h-[34vh] sm:max-h-[36vh] aspect-video">
                                        {renderLocalTile()}
                                    </div>
                                    {remoteParticipants.slice(0, 3).map((p, idx) => (
                                        <div key={p._id || idx} className="w-full h-full max-h-[34vh] sm:max-h-[36vh] aspect-video">
                                            {renderRemoteTile(p, idx)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 5 or 6 Participants: 2 rows x 3 cols */}
                            {(totalParticipants === 5 || totalParticipants === 6) && (
                                <div className="w-full h-full max-w-6xl grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-center justify-center p-1 sm:p-2">
                                    <div className="w-full h-full max-h-[30vh] sm:max-h-[33vh] aspect-video">
                                        {renderLocalTile()}
                                    </div>
                                    {remoteParticipants.slice(0, 5).map((p, idx) => (
                                        <div key={p._id || idx} className="w-full h-full max-h-[30vh] sm:max-h-[33vh] aspect-video">
                                            {renderRemoteTile(p, idx)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 7+ Participants: Grid with smooth dynamic scaling */}
                            {totalParticipants > 6 && (
                                <div className="w-full h-full max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 items-center justify-center overflow-y-auto max-h-[74vh] p-1 sm:p-2">
                                    <div className="w-full h-full min-h-[140px] max-h-[26vh] aspect-video">
                                        {renderLocalTile()}
                                    </div>
                                    {remoteParticipants.map((p, idx) => (
                                        <div key={p._id || idx} className="w-full h-full min-h-[140px] max-h-[26vh] aspect-video">
                                            {renderRemoteTile(p, idx)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                        </>
                    )}
                </main>

                {/* -------------------------------------------------------------
               3. SLIDING DRAWER (Participants / Chat)
               Responsive: overlay on mobile, docked panel on desktop
               ------------------------------------------------------------- */}
                {(isParticipantsOpen || isChatOpen) && (
                    <aside className="fixed sm:relative inset-y-0 right-0 w-full sm:w-80 lg:w-96 border-l border-zinc-800/80 bg-zinc-900/98 sm:bg-zinc-900/90 backdrop-blur-2xl flex flex-col z-40 animate-in slide-in-from-right duration-200 shadow-2xl">
                        {/* Drawer Header */}
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isParticipantsOpen ? (
                                    <>
                                        <Users className="w-4 h-4 text-indigo-400" />
                                        <h3 className="font-semibold text-sm">
                                            People ({totalParticipants})
                                        </h3>
                                    </>
                                ) : (
                                    <>
                                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                                        <h3 className="font-semibold text-sm">Meeting Chat</h3>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (isParticipantsOpen) toggleParticipants();
                                    if (isChatOpen) toggleChat();
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                title="Close panel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Participants List Tab */}
                        {isParticipantsOpen && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {/* Direct Invite Card inside People drawer */}
                                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Invite Others
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-400">
                                            {meeting?.joinCode}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400">
                                        Share the link to test together in another browser window.
                                    </p>
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                                    >
                                        {copiedLink ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                                        ) : (
                                            <Share2 className="w-3.5 h-3.5" />
                                        )}
                                        <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
                                    </button>
                                </div>

                                {/* Current User item */}
                                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                            {getInitials(currentUserName)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-white">
                                                {currentUserName} (You)
                                            </p>
                                            <span className="text-[10px] text-zinc-400">
                                                {isHost ? "Meeting Host" : "Participant"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {isMuted ? (
                                            <MicOff className="w-3.5 h-3.5 text-red-400" />
                                        ) : (
                                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                                        )}
                                        {isVideoOff ? (
                                            <VideoOff className="w-3.5 h-3.5 text-zinc-500" />
                                        ) : (
                                            <Video className="w-3.5 h-3.5 text-zinc-300" />
                                        )}
                                    </div>
                                </div>

                                {/* Remote participants */}
                                {remoteParticipants.map((p, i) => {
                                    const pName =
                                        p.userName ||
                                        p.userId?.fullName ||
                                        p.userId?.name ||
                                        `Participant ${i + 1}`;
                                    const isJoined = p.status === "joined";
                                    return (
                                        <div
                                            key={p._id || i}
                                            className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold">
                                                    {getInitials(pName)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-zinc-200">
                                                        {pName}
                                                    </p>
                                                    <span className="text-[10px] text-zinc-500">
                                                        {p.role === "host" ? "Host • " : ""}
                                                        {isJoined ? "Joined" : "Left"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Mic className="w-3.5 h-3.5 text-zinc-500" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Chat Tab */}
                        {isChatOpen && (
                            <MeetingChat
                                messages={messages}
                                onSendMessage={sendMessage}
                                currentUserId={currentUserId}
                                sending={sending}
                            />
                        )}
                    </aside>
                )}
            </div>

            {/* -------------------------------------------------------------
               4. BOTTOM FLOATING ACTION BAR (Always docked, perfectly centered)
               ------------------------------------------------------------- */}
            <footer className="shrink-0 h-16 sm:h-20 px-3 sm:px-6 flex items-center justify-center relative z-30">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-2xl">
                    {/* Microphone Toggle */}
                    <Button
                        size="icon"
                        variant={isMuted ? "destructive" : "secondary"}
                        onClick={toggleMic}
                        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                        {isMuted ? <MicOff className="size-4 sm:size-4.5" /> : <Mic className="size-4 sm:size-4.5" />}
                    </Button>

                    {/* Camera Toggle */}
                    <Button
                        size="icon"
                        variant={isVideoOff ? "destructive" : "secondary"}
                        onClick={toggleCam}
                        title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                    >
                        {isVideoOff ? <VideoOff className="size-4 sm:size-4.5" /> : <Video className="size-4 sm:size-4.5" />}
                    </Button>

                    {/* Screen Share Toggle */}
                    <Button
                        size="icon"
                        variant={isScreenSharing ? "default" : "secondary"}
                        onClick={toggleScreenShare}
                        title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                    >
                        <MonitorUp className="size-4 sm:size-4.5" />
                    </Button>

                    {/* Meeting Recording Toggle */}
                    <Button
                        size="icon"
                        variant={isRecording ? "destructive" : "secondary"}
                        onClick={isRecording ? stopRecording : startRecording}
                        className={isRecording ? "animate-pulse border border-red-400/40" : ""}
                        title={isRecording ? "Stop Recording (REC)" : "Record Meeting"}
                    >
                        <CircleDot className="size-4 sm:size-4.5" />
                    </Button>

                    {/* Invite / Share Link Quick Action */}
                    <Button
                        size="icon"
                        variant="secondary"
                        onClick={handleCopyLink}
                        title="Copy Meeting Invite Link"
                    >
                        {copiedLink ? (
                            <Check className="size-4 sm:size-4.5 text-emerald-400" />
                        ) : (
                            <Share2 className="size-4 sm:size-4.5 text-primary" />
                        )}
                    </Button>

                    <div className="w-[1px] h-6 bg-border mx-0.5" />

                    {/* Participants Toggle */}
                    <Button
                        size="icon"
                        variant={isParticipantsOpen ? "default" : "secondary"}
                        onClick={toggleParticipants}
                        className="relative"
                        title="Participants"
                    >
                        <Users className="size-4 sm:size-4.5" />
                        <Badge variant="default" className="absolute -top-1 -right-1 px-1 py-0 text-[9px] min-w-4 h-4 flex items-center justify-center">
                            {totalParticipants}
                        </Badge>
                    </Button>

                    {/* Chat Toggle */}
                    <Button
                        size="icon"
                        variant={isChatOpen ? "default" : "secondary"}
                        onClick={toggleChat}
                        className="relative"
                        title="Meeting Chat"
                    >
                        <MessageSquare className="size-4 sm:size-4.5" />
                        {unreadCount > 0 && !isChatOpen && (
                            <Badge variant="destructive" className="absolute -top-1 -right-1 px-1 py-0 text-[9px] min-w-4 h-4 flex items-center justify-center animate-pulse">
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>

                    <div className="w-[1px] h-6 bg-border mx-0.5" />

                    {/* Leave / End Button */}
                    {isHost ? (
                        <div className="relative">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setShowEndDialog((prev) => !prev)}
                                className="gap-1.5 text-xs font-semibold px-3 sm:px-4"
                                title="Leave or End Meeting"
                            >
                                <PhoneOff className="size-3.5" />
                                <span className="hidden sm:inline">End / Leave</span>
                                <ChevronDown className="size-3 opacity-80" />
                            </Button>

                            {/* Host Exit Options Popup */}
                            {showEndDialog && (
                                <div className="absolute right-0 bottom-12 w-52 rounded-xl bg-card border border-border shadow-2xl p-1.5 z-50 text-card-foreground">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowEndDialog(false);
                                            endRoom();
                                        }}
                                        className="w-full justify-start text-destructive hover:bg-destructive/10 text-xs font-medium"
                                    >
                                        End Meeting for All
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowEndDialog(false);
                                            leaveRoom();
                                        }}
                                        className="w-full justify-start text-xs font-medium text-foreground hover:bg-muted"
                                    >
                                        Leave Meeting Only
                                    </Button>
                                    <div className="h-[1px] bg-border my-1" />
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={() => setShowEndDialog(false)}
                                        className="w-full text-xs text-muted-foreground"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={leaveRoom}
                            className="gap-1.5 text-xs font-semibold px-3 sm:px-4"
                            title="Leave Meeting"
                        >
                            <PhoneOff className="size-3.5" />
                            <span className="hidden sm:inline">Leave</span>
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default MeetingRoomPage;
