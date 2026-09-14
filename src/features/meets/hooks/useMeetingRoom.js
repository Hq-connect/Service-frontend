import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import meetingService from "../services/meeting.service";
import {
    setCurrentMeeting,
    setParticipants,
    setRoomLoading,
    clearMeeting,
    setError,
} from "../states/meeting.slice";
import useAuth from "@/features/auth/hooks/useAuth";
import { getTenantSlug } from "@/global/utils/tenant";
import { socket, connectSocket } from "@/socket/config/socket.config";
import { toast } from "sonner";

export const useMeetingRoom = (joinCode) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { currentMeeting, participants, roomLoading, error } = useSelector(
        (state) => state.meetings
    );

    // Media & UI states
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [livekitToken, setLivekitToken] = useState(null);
    const [livekitUrl, setLivekitUrl] = useState(null);

    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const syncIntervalRef = useRef(null);

    // Extract current user ID robustly (supporting nested shapes from Redux)
    const currentUser = user?.data?.user || user?.user || user?.data || user;
    const currentUserId = currentUser?._id || currentUser?.id || user?._id || user?.id;

    // Is current user the host of this meeting?
    const isHost = Boolean(
        currentMeeting &&
        (String(currentMeeting.createdBy) === String(currentUserId) ||
         String(currentMeeting.createdBy?._id) === String(currentUserId) ||
         participants.some((p) => {
             const pUid = typeof p.userId === "object" ? (p.userId?._id || p.userId?.id) : p.userId;
             return String(pUid) === String(currentUserId) && p.role === "host";
         }))
    );

    // 1. Initialize Room and Media
    useEffect(() => {
        if (!joinCode) return;

        let isMounted = true;

        const initRoom = async () => {
            dispatch(setRoomLoading(true));
            dispatch(setError(null));

            try {
                // Join or get meeting session
                const response = await meetingService.joinMeeting(joinCode);
                const meeting = response?.data?.meeting;

                if (!isMounted) return;

                if (!meeting) {
                    throw new Error("Unable to locate meeting session");
                }

                dispatch(setCurrentMeeting(meeting));

                // Process LiveKit credentials if returned with join
                if (response?.data?.livekit?.token) {
                    setLivekitToken(response.data.livekit.token);
                    setLivekitUrl(response.data.livekit.serverUrl);
                } else {
                    // Try dedicated LiveKit token endpoint
                    meetingService.getLiveKitToken(meeting._id).then((tokenRes) => {
                        if (isMounted && tokenRes?.data?.livekit?.token) {
                            setLivekitToken(tokenRes.data.livekit.token);
                            setLivekitUrl(tokenRes.data.livekit.serverUrl);
                        }
                    }).catch(() => {
                        // Optional LiveKit token fetch
                    });
                }

                // Fetch participants
                const partRes = await meetingService.getParticipants(meeting._id);
                if (isMounted) {
                    dispatch(setParticipants(partRes?.data?.participants || []));
                }

                // Acquire local camera and audio tracks
                try {
                    if (navigator?.mediaDevices?.getUserMedia) {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            audio: true,
                            video: true,
                        });
                        if (isMounted) {
                            localStreamRef.current = stream;
                            setLocalStream(stream);
                        } else {
                            stream.getTracks().forEach((track) => track.stop());
                        }
                    }
                } catch (mediaErr) {
                    console.warn("Camera/Microphone access not permitted or unavailable:", mediaErr);
                    if (isMounted) {
                        setIsVideoOff(true);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    const msg = err.response?.data?.message || err.message || "Failed to enter meeting room";
                    dispatch(setError(msg));
                    toast.error(msg);
                }
            } finally {
                if (isMounted) {
                    dispatch(setRoomLoading(false));
                }
            }
        };

        initRoom();

        return () => {
            isMounted = false;
            // Teardown tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
                screenStreamRef.current = null;
            }
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [joinCode, dispatch]);

    // 2. Real-time socket room & event listener
    useEffect(() => {
        if (!currentMeeting?._id) return;
        const meetingId = currentMeeting._id;

        connectSocket();
        socket.emit("meeting:join", { meetingId });

        const handleScreenShareStart = ({ userId }) => {
            if (userId !== currentUserId) {
                toast.info("A participant started screen sharing");
            }
            meetingService.getParticipants(meetingId).then((res) => {
                dispatch(setParticipants(res?.data?.participants || []));
            }).catch(() => {});
        };

        const handleScreenShareStop = ({ userId }) => {
            if (userId !== currentUserId) {
                toast.info("Screen sharing ended");
            }
            meetingService.getParticipants(meetingId).then((res) => {
                dispatch(setParticipants(res?.data?.participants || []));
            }).catch(() => {});
        };

        const handleParticipantUpdate = () => {
            meetingService.getParticipants(meetingId).then((res) => {
                dispatch(setParticipants(res?.data?.participants || []));
            }).catch(() => {});
        };

        const handleMeetingEnded = () => {
            toast.error("The host has ended this meeting");
            dispatch(clearMeeting());
            navigate("/meets");
        };

        socket.on("meeting:screenshare:start", handleScreenShareStart);
        socket.on("meeting:screenshare:stop", handleScreenShareStop);
        socket.on("meeting:participant:joined", handleParticipantUpdate);
        socket.on("meeting:participant:left", handleParticipantUpdate);
        socket.on("meeting:peer:joined", handleParticipantUpdate);
        socket.on("meeting:peer:left", handleParticipantUpdate);
        socket.on("meeting:ended", handleMeetingEnded);

        return () => {
            socket.emit("meeting:leave", { meetingId });
            socket.off("meeting:screenshare:start", handleScreenShareStart);
            socket.off("meeting:screenshare:stop", handleScreenShareStop);
            socket.off("meeting:participant:joined", handleParticipantUpdate);
            socket.off("meeting:participant:left", handleParticipantUpdate);
            socket.off("meeting:peer:joined", handleParticipantUpdate);
            socket.off("meeting:peer:left", handleParticipantUpdate);
            socket.off("meeting:ended", handleMeetingEnded);
        };
    }, [currentMeeting?._id, currentUserId, dispatch, navigate]);

    // 3. Periodic participants refresh (every 8s as fallback)
    useEffect(() => {
        if (!currentMeeting?._id) return;

        const refreshParticipants = async () => {
            try {
                const res = await meetingService.getParticipants(currentMeeting._id);
                dispatch(setParticipants(res?.data?.participants || []));
            } catch (err) {
                // Background sync failure - ignore
            }
        };

        syncIntervalRef.current = setInterval(refreshParticipants, 8000);

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [currentMeeting?._id, dispatch]);

    // 4. Meeting Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format elapsed time to HH:MM:SS or MM:SS
    const formatTime = useCallback((totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n) => String(n).padStart(2, "0");
        if (hours > 0) {
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
        return `${pad(minutes)}:${pad(seconds)}`;
    }, []);

    // Media Controls
    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            audioTracks.forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMuted((prev) => !prev);
        } else {
            setIsMuted((prev) => !prev);
        }
    }, []);

    const toggleCam = useCallback(async () => {
        if (localStreamRef.current) {
            const videoTracks = localStreamRef.current.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks.forEach((track) => {
                    track.enabled = !track.enabled;
                });
                setIsVideoOff((prev) => !prev);
            } else {
                // If stream didn't have video track initially, try re-acquiring
                try {
                    const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true });
                    const newTrack = videoOnly.getVideoTracks()[0];
                    localStreamRef.current.addTrack(newTrack);
                    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
                    setIsVideoOff(false);
                } catch (err) {
                    toast.error("Unable to enable camera");
                }
            }
        } else {
            setIsVideoOff((prev) => !prev);
        }
    }, []);

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            // Stop sharing
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
                screenStreamRef.current = null;
            }
            setScreenStream(null);
            setIsScreenSharing(false);
            if (currentMeeting?._id) {
                meetingService.stopScreenShare(currentMeeting._id).catch(() => {});
            }
            toast.info("Screen sharing ended");
        } else {
            // Start sharing
            try {
                if (navigator?.mediaDevices?.getDisplayMedia) {
                    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                    screenStreamRef.current = stream;
                    setScreenStream(stream);
                    setIsScreenSharing(true);

                    if (currentMeeting?._id) {
                        meetingService.startScreenShare(currentMeeting._id).catch(() => {});
                    }

                    stream.getVideoTracks()[0].onended = () => {
                        setIsScreenSharing(false);
                        setScreenStream(null);
                        screenStreamRef.current = null;
                        if (currentMeeting?._id) {
                            meetingService.stopScreenShare(currentMeeting._id).catch(() => {});
                        }
                    };

                    toast.success("Sharing your screen");
                } else {
                    toast.error("Screen sharing not supported on this device/browser");
                }
            } catch (err) {
                console.warn("Screen share cancelled or not allowed:", err);
            }
        }
    }, [isScreenSharing, currentMeeting?._id]);

    const toggleChat = useCallback(() => {
        setIsChatOpen((prev) => !prev);
        if (!isChatOpen) setIsParticipantsOpen(false);
    }, [isChatOpen]);

    const toggleParticipants = useCallback(() => {
        setIsParticipantsOpen((prev) => !prev);
        if (!isParticipantsOpen) setIsChatOpen(false);
    }, [isParticipantsOpen]);

    // Room Exit Actions
    const leaveRoom = useCallback(async () => {
        try {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (currentMeeting?._id) {
                await meetingService.leaveMeeting(currentMeeting._id);
            }
            dispatch(clearMeeting());
            toast.info("You left the meeting");
            navigate("/meets");
        } catch (err) {
            navigate("/meets");
        }
    }, [currentMeeting?._id, dispatch, navigate]);

    const endRoom = useCallback(async () => {
        try {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (currentMeeting?._id) {
                await meetingService.endMeeting(currentMeeting._id);
            }
            dispatch(clearMeeting());
            toast.success("Meeting ended for all participants");
            navigate("/meets");
        } catch (err) {
            navigate("/meets");
        }
    }, [currentMeeting?._id, dispatch, navigate]);

    const copyJoinCode = useCallback(() => {
        if (currentMeeting?.joinCode) {
            navigator.clipboard.writeText(currentMeeting.joinCode);
            toast.success("Meeting code copied to clipboard!");
        }
    }, [currentMeeting?.joinCode]);

    const tenantSlug = useSelector((state) => state.tenant?.slug || state.tenant?.tenant?.slug) || getTenantSlug();

    const copyInviteUrl = useCallback(() => {
        const origin = window.location.origin;
        const joinCode = currentMeeting?.joinCode;
        if (!joinCode) {
            toast.error("Meeting join code not available");
            return;
        }
        const url = new URL(`${origin}/meets/room/${joinCode}`);
        if (tenantSlug) {
            url.searchParams.set("slug", tenantSlug);
        }
        navigator.clipboard.writeText(url.toString());
        toast.success("Meeting invite link copied to clipboard!");
    }, [currentMeeting?.joinCode, tenantSlug]);

    const remoteSharer = participants.find((p) => {
        const pUid = typeof p.userId === "object" ? (p.userId?._id || p.userId?.id) : p.userId;
        return p.isScreenSharing && String(pUid) !== String(currentUserId);
    });

    // Recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);

    const startRecording = useCallback(async () => {
        try {
            // Select active stream to record (screen share priority, fallback to local camera)
            let streamToRecord = screenStreamRef.current || localStreamRef.current;

            if (!streamToRecord || streamToRecord.getTracks().length === 0) {
                try {
                    streamToRecord = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: true,
                    });
                } catch (_) {
                    toast.error("An active video or screen share stream is required to record");
                    return;
                }
            }

            recordedChunksRef.current = [];
            const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
                ? "video/webm;codecs=vp9,opus"
                : MediaRecorder.isTypeSupported("video/webm")
                ? "video/webm"
                : "video/mp4";

            const recorder = new MediaRecorder(streamToRecord, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
                const fileUrl = URL.createObjectURL(blob);

                try {
                    const recData = {
                        title: currentMeeting?.title ? `${currentMeeting.title} - Recording` : "Meeting Recording",
                        duration: recordingSeconds || 1,
                        fileSize: blob.size || 1024,
                        fileUrl,
                        recorderName: currentUser?.fullName || currentUser?.name || "Host",
                    };
                    await meetingService.saveRecording(currentMeeting?._id, recData);
                    toast.success("Meeting recording saved to Recorded Sessions!");
                } catch (err) {
                    console.error("Failed to save recording metadata:", err);
                    toast.error("Failed to save recording to sessions archive");
                }
            };

            recorder.start(1000);
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            setRecordingSeconds(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);

            toast.info("Meeting recording started");
        } catch (err) {
            console.error("Failed to start recording:", err);
            toast.error("Could not start recording");
        }
    }, [currentMeeting?._id, currentMeeting?.title, currentUser, recordingSeconds]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        setIsRecording(false);
    }, []);

    // Format recording timer helper (MM:SS)
    const formatRecTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    return {
        currentMeeting,
        participants,
        roomLoading,
        error,
        isHost,
        user,
        tenantSlug,
        // Media controls & states
        isMuted,
        isVideoOff,
        isScreenSharing,
        remoteSharer,
        localStream,
        screenStream,
        toggleMic,
        toggleCam,
        toggleScreenShare,
        // Recording states
        isRecording,
        recordingDuration: formatRecTime(recordingSeconds),
        startRecording,
        stopRecording,
        // LiveKit Media
        livekitToken,
        livekitUrl,
        setLivekitToken,
        setLivekitUrl,
        setIsMuted,
        setIsVideoOff,
        setIsScreenSharing,
        // UI panel toggles
        isChatOpen,
        isParticipantsOpen,
        toggleChat,
        toggleParticipants,
        // Timers & details
        elapsedTime: formatTime(elapsedSeconds),
        // Actions
        leaveRoom,
        endRoom,
        copyJoinCode,
        copyInviteUrl,
    };
};

export default useMeetingRoom;
