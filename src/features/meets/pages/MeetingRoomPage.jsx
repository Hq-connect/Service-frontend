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
} from "lucide-react";

export const MeetingRoomPage = ({
    meeting,
    participants,
    user,
    isHost,
    // Media states
    isMuted,
    isVideoOff,
    isScreenSharing,
    localStream,
    screenStream,
    toggleMic,
    toggleCam,
    toggleScreenShare,
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
}) => {
    const localVideoRef = useRef(null);
    const screenVideoRef = useRef(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Attach local camera stream to local video element
    useEffect(() => {
        if (localVideoRef.current && localStream && !isVideoOff) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isVideoOff]);

    // Attach screen share stream to screen video element
    useEffect(() => {
        if (screenVideoRef.current && screenStream && isScreenSharing) {
            screenVideoRef.current.srcObject = screenStream;
        }
    }, [screenStream, isScreenSharing]);

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

    const currentUserName = user?.name || user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "You");

    // Filter remote participants
    const currentUserId = user?._id || user?.id || user?.user?._id;
    const remoteParticipants = participants.filter(
        (p) => p.userId !== currentUserId && p.userId?._id !== currentUserId
    );

    return (
        <div className="relative flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
            {/* Top Navigation Bar */}
            <header className="h-16 px-5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md z-20">
                {/* Left: Meeting Title & Status */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                            Live
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                            {meeting?.title || "Instant Meeting"}
                        </h1>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {elapsedTime}
                        </span>
                    </div>
                </div>

                {/* Right: Join Code & Share Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Join Code Pill */}
                    <button
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
                        title="Copy meeting code"
                    >
                        {copiedCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="font-semibold">{meeting?.joinCode}</span>
                    </button>

                    {/* Share Link Pill */}
                    <button
                        onClick={handleCopyLink}
                        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
                        title="Copy invite link"
                    >
                        {copiedLink ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                            <Share2 className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Invite</span>
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-all"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </header>

            {/* Main Center Stage */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Video Area Grid */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
                    {/* If screen sharing is active */}
                    {isScreenSharing && (
                        <div className="relative w-full aspect-video max-h-[60vh] rounded-2xl overflow-hidden bg-zinc-900 border border-indigo-500/40 shadow-2xl mb-4">
                            <video
                                ref={screenVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain bg-black"
                            />
                            <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-indigo-600/80 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                                <MonitorUp className="w-3.5 h-3.5" />
                                You are sharing your screen
                            </div>
                        </div>
                    )}

                    {/* Participant Tiles Grid */}
                    <div
                        className={`flex-1 grid gap-4 w-full h-full items-center justify-center ${
                            remoteParticipants.length === 0
                                ? "grid-cols-1 max-w-2xl mx-auto"
                                : remoteParticipants.length === 1
                                ? "grid-cols-1 md:grid-cols-2"
                                : remoteParticipants.length <= 3
                                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                        }`}
                    >
                        {/* 1. Local User Tile */}
                        <div className="relative group w-full h-full min-h-[220px] max-h-[480px] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-900/80 border border-zinc-800/80 shadow-lg flex items-center justify-center">
                            {!isVideoOff && localStream ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover -scale-x-100"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-600/20 border-2 border-indigo-400/30">
                                        {getInitials(currentUserName)}
                                    </div>
                                    <span className="text-xs text-zinc-400 font-medium">
                                        Camera Off
                                    </span>
                                </div>
                            )}

                            {/* Name & Status Overlay */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 text-xs font-medium text-zinc-200">
                                    <span>{currentUserName} (You)</span>
                                    {isHost && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                            Host
                                        </span>
                                    )}
                                </div>

                                <div className={`p-1.5 rounded-lg backdrop-blur-md ${
                                    isMuted
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-zinc-950/70 text-zinc-300 border border-zinc-800/60"
                                }`}>
                                    {isMuted ? (
                                        <MicOff className="w-3.5 h-3.5" />
                                    ) : (
                                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Remote Participants Tiles */}
                        {remoteParticipants.map((p, idx) => {
                            const pName = p.userName || p.userId?.fullName || p.userId?.name || `Participant ${idx + 1}`;
                            const pIsHost = p.role === "host";
                            const pJoined = p.status === "joined";

                            return (
                                <div
                                    key={p._id || idx}
                                    className={`relative group w-full h-full min-h-[220px] max-h-[480px] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-900/80 border shadow-lg flex items-center justify-center transition-all ${
                                        pJoined ? "border-zinc-800/80" : "border-zinc-800/40 opacity-60"
                                    }`}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl border-2 border-cyan-400/30">
                                            {getInitials(pName)}
                                        </div>
                                        <span className="text-xs text-zinc-400 font-medium">
                                            {pJoined ? "Connected" : "Left meeting"}
                                        </span>
                                    </div>

                                    {/* Name & Role overlay */}
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 text-xs font-medium text-zinc-200">
                                            <span>{pName}</span>
                                            {pIsHost && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                                    Host
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-1.5 rounded-lg backdrop-blur-md bg-zinc-950/70 text-zinc-300 border border-zinc-800/60">
                                            <Mic className="w-3.5 h-3.5 text-zinc-400" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sliding Right Drawer Panel */}
                {(isParticipantsOpen || isChatOpen) && (
                    <aside className="w-80 lg:w-96 border-l border-zinc-800/80 bg-zinc-900/95 backdrop-blur-xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
                        {/* Drawer Header */}
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isParticipantsOpen ? (
                                    <>
                                        <Users className="w-4 h-4 text-indigo-400" />
                                        <h3 className="font-semibold text-sm">
                                            People ({participants.length || 1})
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
                                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Participants List Tab */}
                        {isParticipantsOpen && (
                            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
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
                                    const pName = p.userName || p.userId?.fullName || p.userId?.name || `Participant ${i + 1}`;
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

                        {/* Chat Tab Preview */}
                        {isChatOpen && (
                            <div className="flex-1 flex flex-col justify-between p-4">
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                                    <MessageSquare className="w-8 h-8 text-zinc-600 mb-2" />
                                    <p className="text-xs font-medium text-zinc-400">
                                        Meeting Chat
                                    </p>
                                    <p className="text-[11px] text-zinc-600 mt-1">
                                        Messages are saved and visible to active participants.
                                    </p>
                                </div>

                                {/* Chat input placeholder (Day 5 integration point) */}
                                <div className="pt-3 border-t border-zinc-800">
                                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2">
                                        <input
                                            type="text"
                                            placeholder="Send a message to everyone..."
                                            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none px-2"
                                        />
                                        <button
                                            type="button"
                                            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="h-20 px-6 flex items-center justify-center relative z-20">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 shadow-2xl">
                    {/* Microphone Toggle */}
                    <button
                        onClick={toggleMic}
                        className={`p-3 rounded-xl transition-all ${
                            isMuted
                                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                                : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                        }`}
                        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Camera Toggle */}
                    <button
                        onClick={toggleCam}
                        className={`p-3 rounded-xl transition-all ${
                            isVideoOff
                                ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                                : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                        }`}
                        title={isVideoOff ? "Turn On Camera" : "Turn Off Camera"}
                    >
                        {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>

                    {/* Screen Share Toggle */}
                    <button
                        onClick={toggleScreenShare}
                        className={`p-3 rounded-xl transition-all ${
                            isScreenSharing
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
                        }`}
                        title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                    >
                        <MonitorUp className="w-5 h-5" />
                    </button>

                    <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

                    {/* Participants Toggle */}
                    <button
                        onClick={toggleParticipants}
                        className={`relative p-3 rounded-xl transition-all ${
                            isParticipantsOpen
                                ? "bg-zinc-800 text-indigo-400 border border-indigo-500/30"
                                : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        }`}
                        title="Participants"
                    >
                        <Users className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                            {participants.length || 1}
                        </span>
                    </button>

                    {/* Chat Toggle */}
                    <button
                        onClick={toggleChat}
                        className={`p-3 rounded-xl transition-all ${
                            isChatOpen
                                ? "bg-zinc-800 text-indigo-400 border border-indigo-500/30"
                                : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        }`}
                        title="Meeting Chat"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

                    {/* Leave / End Button */}
                    {isHost ? (
                        <div className="relative">
                            <button
                                onClick={() => setShowEndDialog(true)}
                                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-lg shadow-red-600/25 active:scale-95 transition-all"
                                title="Leave or End Meeting"
                            >
                                <PhoneOff className="w-4 h-4" />
                                <span className="hidden sm:inline">End / Leave</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                            </button>

                            {/* Host Exit Options Popup */}
                            {showEndDialog && (
                                <div className="absolute right-0 bottom-16 w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                                    <button
                                        onClick={() => {
                                            setShowEndDialog(false);
                                            endRoom();
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        End Meeting for All
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowEndDialog(false);
                                            leaveRoom();
                                        }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                                    >
                                        Leave Meeting Only
                                    </button>
                                    <div className="h-[1px] bg-zinc-800 my-1" />
                                    <button
                                        onClick={() => setShowEndDialog(false)}
                                        className="w-full text-center px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={leaveRoom}
                            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-lg shadow-red-600/25 active:scale-95 transition-all"
                            title="Leave Meeting"
                        >
                            <PhoneOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Leave</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingRoomPage;
