import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import useMeetingRoom from "../hooks/useMeetingRoom";
import MeetingRoomPage from "../pages/MeetingRoomPage";
import { Video, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

export const MeetingRoomContainer = () => {
    const { joinCode } = useParams();
    const navigate = useNavigate();

    const roomProps = useMeetingRoom(joinCode);
    const { roomLoading, error, currentMeeting } = roomProps;

    if (roomLoading && !currentMeeting) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full bg-zinc-950 text-zinc-100 p-6">
                <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Video className="w-8 h-8 animate-pulse" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                    </span>
                </div>
                <h2 className="text-lg font-semibold text-white tracking-tight">
                    Connecting to Meeting Room...
                </h2>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                    Code: {joinCode}
                </p>
            </div>
        );
    }

    if (error && !currentMeeting) {
        return (
            <div className="flex flex-col items-center justify-center h-screen w-full bg-zinc-950 text-zinc-100 p-6 text-center">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                    Unable to Join Meeting
                </h2>
                <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6">
                    {error}
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry
                    </button>
                    <button
                        onClick={() => navigate("/meets")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-lg shadow-indigo-600/20 transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Meetings
                    </button>
                </div>
            </div>
        );
    }

    return <MeetingRoomPage {...roomProps} meeting={currentMeeting} />;
};

export default MeetingRoomContainer;
