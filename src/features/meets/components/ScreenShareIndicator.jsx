import React from "react";
import { MonitorUp, X } from "lucide-react";

export const ScreenShareIndicator = ({
    isSharing,
    sharerName = "Someone",
    isSelf = false,
    onStopShare,
}) => {
    if (!isSharing) return null;

    return (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-medium backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <MonitorUp className="size-3.5 shrink-0 text-blue-400" />
            <span className="truncate max-w-[180px]">
                {isSelf ? "You are presenting" : `${sharerName} is presenting`}
            </span>
            {isSelf && onStopShare && (
                <button
                    onClick={onStopShare}
                    className="ml-1 px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Stop presenting"
                >
                    <X className="size-3" />
                    Stop
                </button>
            )}
        </div>
    );
};

export default ScreenShareIndicator;
