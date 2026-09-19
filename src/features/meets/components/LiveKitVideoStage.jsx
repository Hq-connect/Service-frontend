import React, { useMemo, useEffect, useCallback } from "react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    VideoTrack,
    useTracks,
    useParticipants,
    useLocalParticipant,
    useRoomContext,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, MonitorUp, Radio, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const getInitials = (name) => {
    if (!name) return "U";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

// -------------------------------------------------------------
// Participant Tile Component
// -------------------------------------------------------------
const LiveKitParticipantTile = ({
    participant,
    cameraTrack,
    isHost = false,
    isCompact = false,
    participantNameMap = {},
}) => {
    const isLocal = participant.isLocal;
    const isSpeaking = participant.isSpeaking;
    const isMicOn = participant.isMicrophoneEnabled;
    const isCameraOn = Boolean(cameraTrack?.publication?.track && !cameraTrack?.publication?.isMuted);
    
    // Resolve display name: LiveKit token name > DB participant name > fallback
    const resolvedDbName = participantNameMap[String(participant.identity)];
    const displayName =
        participant.name ||
        resolvedDbName ||
        (isLocal ? "You" : `Participant ${String(participant.identity).slice(-4)}`);

    return (
        <div
            className={`relative group w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border shadow-xl flex items-center justify-center transition-all duration-200 ${
                isSpeaking
                    ? "border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20"
                    : "border-zinc-800"
            } ${isCompact ? "min-h-[100px]" : ""}`}
        >
            {/* Live Video Feed or Fallback Tile */}
            {isCameraOn ? (
                <VideoTrack
                    trackRef={cameraTrack}
                    className={`w-full h-full object-cover ${isLocal ? "-scale-x-100" : ""}`}
                />
            ) : (
                <div className="flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                    <div
                        className={`rounded-full bg-gradient-to-tr ${
                            isLocal
                                ? "from-indigo-600 to-violet-600 border-indigo-400/30"
                                : "from-cyan-600 to-blue-600 border-cyan-400/30"
                        } flex items-center justify-center text-white font-bold shadow-xl border-2 ${
                            isCompact
                                ? "w-10 h-10 text-sm"
                                : "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl"
                        }`}
                    >
                        {getInitials(displayName)}
                    </div>
                    {!isCompact && (
                        <span className="text-[11px] sm:text-xs text-zinc-400 font-medium tracking-wide">
                            Camera Off
                        </span>
                    )}
                </div>
            )}

            {/* Speaking Pulse Glow */}
            {isSpeaking && (
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    Speaking
                </div>
            )}

            {/* User Info Bar at Bottom */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 text-[11px] font-medium text-zinc-200 shadow-md">
                    <span className="truncate max-w-[120px]">
                        {displayName} {isLocal ? "(You)" : ""}
                    </span>
                    {isHost && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                            Host
                        </span>
                    )}
                </div>

                <div
                    className={`p-1.5 rounded-lg backdrop-blur-md shadow-md ${
                        !isMicOn
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-zinc-950/80 text-zinc-300 border border-zinc-800/80"
                    }`}
                >
                    {isMicOn ? (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                    )}
                </div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------
// LiveKit Media Sync — syncs parent state with LiveKit room
// -------------------------------------------------------------
const LiveKitMediaSync = ({ isMuted, isVideoOff, isScreenSharing, setIsScreenSharing }) => {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // Sync microphone state with LiveKit
    useEffect(() => {
        if (!localParticipant) return;
        const shouldEnable = !isMuted;
        localParticipant.setMicrophoneEnabled(shouldEnable).catch((err) => {
            console.warn("LiveKit microphone toggle:", err?.message);
        });
    }, [isMuted, localParticipant]);

    // Sync camera state with LiveKit
    useEffect(() => {
        if (!localParticipant) return;
        const shouldEnable = !isVideoOff;
        localParticipant.setCameraEnabled(shouldEnable).catch((err) => {
            console.warn("LiveKit camera toggle:", err?.message);
        });
    }, [isVideoOff, localParticipant]);

    // Sync screen share state with LiveKit
    useEffect(() => {
        if (!localParticipant) return;
        localParticipant.setScreenShareEnabled(isScreenSharing).catch((err) => {
            console.warn("LiveKit screen share error:", err);
            if (isScreenSharing && setIsScreenSharing) {
                setIsScreenSharing(false);
            }
            if (err?.name === "NotAllowedError") {
                toast.info("Screen sharing cancelled or permission denied");
            } else {
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                    toast.error("Screen sharing is not supported by your mobile browser. Please use Chrome on desktop or an updated mobile browser.");
                } else {
                    toast.error("Failed to share screen: " + (err?.message || "Unknown error"));
                }
            }
        });
    }, [isScreenSharing, localParticipant, setIsScreenSharing]);

    // Listen for screen share ending via browser UI (user clicks "Stop sharing")
    useEffect(() => {
        if (!room) return;

        const handleTrackUnpublished = (publication, participant) => {
            if (
                participant.isLocal &&
                publication.source === Track.Source.ScreenShare &&
                setIsScreenSharing
            ) {
                setIsScreenSharing(false);
            }
        };

        room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
        return () => {
            room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
        };
    }, [room, setIsScreenSharing]);

    return null; // Invisible sync component
};

// -------------------------------------------------------------
// LiveKit Active Room Stage (Inner Grid Layout)
// -------------------------------------------------------------
const LiveKitStageInner = ({
    hostUserId,
    isMuted,
    isVideoOff,
    isScreenSharing,
    setIsScreenSharing,
    dbParticipants = [],
}) => {
    const participants = useParticipants();
    const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
        onlySubscribed: false,
    });

    // Build lookup map for participant names from database state
    const participantNameMap = useMemo(() => {
        const map = {};
        if (Array.isArray(dbParticipants)) {
            for (const p of dbParticipants) {
                const uid = typeof p.userId === "object" ? (p.userId?._id || p.userId?.id) : p.userId;
                const name =
                    p.userName ||
                    (p.userId?.firstName ? `${p.userId.firstName} ${p.userId.lastName || ""}`.trim() : null) ||
                    p.userId?.fullName ||
                    p.userId?.name ||
                    p.name;
                if (uid && name) {
                    map[String(uid)] = name;
                }
            }
        }
        return map;
    }, [dbParticipants]);

    // Detect active screen share track
    const screenShareTrack = useMemo(() => {
        return tracks.find((t) => t.source === Track.Source.ScreenShare);
    }, [tracks]);

    const totalCount = participants.length;

    // A. SCREEN SHARING MODE
    if (screenShareTrack) {
        const sharer = screenShareTrack.participant;
        const sharerName =
            sharer?.name ||
            participantNameMap[String(sharer?.identity)] ||
            (sharer?.isLocal ? "You" : "Participant");

        return (
            <div className="flex-1 flex flex-col w-full h-full min-h-0 items-center justify-center gap-3">
                {/* Media Sync (invisible) */}
                <LiveKitMediaSync
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    isScreenSharing={isScreenSharing}
                    setIsScreenSharing={setIsScreenSharing}
                />

                {/* Dominant Screen Share Stage */}
                <div className="flex-1 min-h-0 w-full rounded-2xl overflow-hidden bg-black border border-indigo-500/40 shadow-2xl flex items-center justify-center relative">
                    <VideoTrack
                        trackRef={screenShareTrack}
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-indigo-600/80 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5">
                        <MonitorUp className="w-3.5 h-3.5" />
                        <span>{sharer?.isLocal ? "You are presenting" : `${sharerName} is presenting`}</span>
                    </div>
                </div>

                {/* Participant Filmstrip */}
                <div className="shrink-0 h-24 sm:h-28 w-full flex items-center justify-center gap-3 overflow-x-auto py-1 px-2">
                    {participants.map((p) => {
                        const camTrack = tracks.find(
                            (t) => t.participant.identity === p.identity && t.source === Track.Source.Camera
                        );
                        return (
                            <div key={p.identity} className="h-full aspect-video shrink-0">
                                <LiveKitParticipantTile
                                    participant={p}
                                    cameraTrack={camTrack}
                                    isHost={String(p.identity) === String(hostUserId)}
                                    isCompact={true}
                                    participantNameMap={participantNameMap}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // B. DYNAMIC AUTO-FITTING PARTICIPANT GRID
    return (
        <div className="w-full h-full min-h-0 flex items-center justify-center">
            {/* Media Sync (invisible) */}
            <LiveKitMediaSync
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                isScreenSharing={isScreenSharing}
                setIsScreenSharing={setIsScreenSharing}
            />

            {/* 1 Participant: Single Large Center Stage */}
            {totalCount <= 1 && (
                <div className="w-full h-full flex items-center justify-center p-1 sm:p-2">
                    <div className="w-full max-w-4xl h-full max-h-[72vh] aspect-[4/3] sm:aspect-video">
                        {participants[0] && (
                            <LiveKitParticipantTile
                                participant={participants[0]}
                                cameraTrack={tracks.find(
                                    (t) => t.participant.identity === participants[0].identity && t.source === Track.Source.Camera
                                )}
                                isHost={String(participants[0].identity) === String(hostUserId)}
                                participantNameMap={participantNameMap}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* 2 Participants: Side-by-Side on Desktop, Stacked on Mobile */}
            {totalCount === 2 && (
                <div className="w-full h-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 p-1 sm:p-2">
                    {participants.map((p) => (
                        <div key={p.identity} className="flex-1 w-full h-full max-h-[38vh] md:max-h-[70vh] aspect-video">
                            <LiveKitParticipantTile
                                participant={p}
                                cameraTrack={tracks.find(
                                    (t) => t.participant.identity === p.identity && t.source === Track.Source.Camera
                                )}
                                isHost={String(p.identity) === String(hostUserId)}
                                participantNameMap={participantNameMap}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* 3 or 4 Participants: 2x2 Responsive Grid */}
            {(totalCount === 3 || totalCount === 4) && (
                <div className="w-full h-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center justify-center p-1 sm:p-2">
                    {participants.map((p) => (
                        <div key={p.identity} className="w-full h-full max-h-[34vh] sm:max-h-[36vh] aspect-video">
                            <LiveKitParticipantTile
                                participant={p}
                                cameraTrack={tracks.find(
                                    (t) => t.participant.identity === p.identity && t.source === Track.Source.Camera
                                )}
                                isHost={String(p.identity) === String(hostUserId)}
                                participantNameMap={participantNameMap}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* 5 or 6 Participants: 2 rows x 3 cols */}
            {(totalCount === 5 || totalCount === 6) && (
                <div className="w-full h-full max-w-6xl grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-center justify-center p-1 sm:p-2">
                    {participants.map((p) => (
                        <div key={p.identity} className="w-full h-full max-h-[30vh] sm:max-h-[33vh] aspect-video">
                            <LiveKitParticipantTile
                                participant={p}
                                cameraTrack={tracks.find(
                                    (t) => t.participant.identity === p.identity && t.source === Track.Source.Camera
                                )}
                                isHost={String(p.identity) === String(hostUserId)}
                                participantNameMap={participantNameMap}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* 7+ Participants: Grid with smooth dynamic scaling */}
            {totalCount > 6 && (
                <div className="w-full h-full max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 items-center justify-center overflow-y-auto max-h-[74vh] p-1 sm:p-2">
                    {participants.map((p) => (
                        <div key={p.identity} className="w-full h-full min-h-[140px] max-h-[26vh] aspect-video">
                            <LiveKitParticipantTile
                                participant={p}
                                cameraTrack={tracks.find(
                                    (t) => t.participant.identity === p.identity && t.source === Track.Source.Camera
                                )}
                                isHost={String(p.identity) === String(hostUserId)}
                                participantNameMap={participantNameMap}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// -------------------------------------------------------------
// LiveKit Main Stage Container
// -------------------------------------------------------------
export const LiveKitVideoStage = ({
    serverUrl,
    token,
    hostUserId,
    isMuted,
    isVideoOff,
    isScreenSharing,
    setIsScreenSharing,
    dbParticipants = [],
    onDisconnected,
    onError,
}) => {
    return (
        <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect={Boolean(serverUrl && token)}
            audio={!isMuted}
            video={!isVideoOff}
            onDisconnected={onDisconnected}
            onError={onError}
            className="w-full h-full min-h-0 flex flex-col relative"
        >
            {/* Automatic Multi-Party Audio Playback */}
            <RoomAudioRenderer />

            {/* Visual Media & Grid Layout */}
            <LiveKitStageInner
                hostUserId={hostUserId}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                isScreenSharing={isScreenSharing}
                setIsScreenSharing={setIsScreenSharing}
                dbParticipants={dbParticipants}
            />
        </LiveKitRoom>
    );
};

export default LiveKitVideoStage;
