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

    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const syncIntervalRef = useRef(null);

    // Extract current user ID
    const currentUserId = user?._id || user?.id || user?.user?._id;

    // Is current user the host of this meeting?
    const isHost = Boolean(
        currentMeeting &&
        (currentMeeting.createdBy === currentUserId ||
         currentMeeting.createdBy?._id === currentUserId ||
         participants.some((p) => (p.userId === currentUserId || p.userId?._id === currentUserId) && p.role === "host"))
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

    // 2. Periodic participants refresh (every 8s)
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

    // 3. Meeting Timer
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

    const copyInviteUrl = useCallback(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Meeting invite link copied!");
    }, []);

    return {
        currentMeeting,
        participants,
        roomLoading,
        error,
        isHost,
        user,
        // Media controls & states
        isMuted,
        isVideoOff,
        isScreenSharing,
        localStream,
        screenStream,
        toggleMic,
        toggleCam,
        toggleScreenShare,
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
