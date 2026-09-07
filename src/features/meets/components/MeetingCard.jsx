import React, { useState } from "react";
import { Calendar, Clock, Copy, Check, Video, XCircle, Users } from "lucide-react";
import { toast } from "sonner";

export const MeetingCard = ({ meeting, onJoin, onCancel }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        if (meeting?.joinCode) {
            navigator.clipboard.writeText(meeting.joinCode);
            setCopied(true);
            toast.success("Join code copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "ongoing":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Live Now
                    </span>
                );
            case "scheduled":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Scheduled
                    </span>
                );
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        Completed
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Cancelled
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Instant Meeting";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        }).format(date);
    };

    return (
        <div className="group relative bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 transition-all duration-200 backdrop-blur-sm flex flex-col justify-between shadow-lg hover:shadow-indigo-500/5">
            <div>
                {/* Header & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-lg text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {meeting.title}
                    </h3>
                    {getStatusBadge(meeting.status)}
                </div>

                {/* Description */}
                {meeting.description && (
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                        {meeting.description}
                    </p>
                )}

                {/* Metadata details */}
                <div className="space-y-2 text-xs text-zinc-400 mb-5">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        <span>{formatDate(meeting.scheduledAt)}</span>
                    </div>

                    {meeting.duration && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-500" />
                            <span>{meeting.duration} minutes</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                        <Users className="w-4 h-4 text-zinc-500" />
                        <span className="font-mono bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-300 flex items-center gap-1.5">
                            {meeting.joinCode}
                            <button
                                onClick={handleCopy}
                                className="text-zinc-400 hover:text-white transition-colors"
                                title="Copy join code"
                            >
                                {copied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </span>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800/60">
                {(meeting.status === "scheduled" || meeting.status === "ongoing") && (
                    <button
                        onClick={() => onJoin(meeting.joinCode)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
                    >
                        <Video className="w-4 h-4" />
                        Join Meeting
                    </button>
                )}

                {meeting.status === "scheduled" && onCancel && (
                    <button
                        onClick={() => onCancel(meeting._id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        title="Cancel Meeting"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MeetingCard;
