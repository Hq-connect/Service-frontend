import React, { useState } from "react";
import {
    Clock,
    Copy,
    Check,
    Video,
    XCircle,
    Edit3,
    Play,
    Repeat,
    MoreHorizontal,
    Calendar,
    ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { formatRecurrenceBadge } from "../utils/recurrenceUtils";

export const MeetingCard = ({ meeting, onJoin, onCancel, onEnd, onEdit }) => {
    const [copied, setCopied] = useState(false);
    const { currentUserId } = useCurrentUser();
    const isHost = String(meeting?.hostId || meeting?.createdBy) === String(currentUserId);
    const isRecurring = Boolean(meeting?.recurrenceType && meeting.recurrenceType !== "NONE");

    const handleCopy = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (meeting?.joinCode) {
            navigator.clipboard.writeText(meeting.joinCode);
            setCopied(true);
            toast.success("Join code copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isStartingSoon = () => {
        if (meeting.status !== "scheduled" || !meeting.scheduledAt) return false;
        const diff = new Date(meeting.scheduledAt).getTime() - Date.now();
        return diff > 0 && diff <= 15 * 60 * 1000;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "ongoing":
                return (
                    <Badge
                        variant="outline"
                        className="bg-status-live text-status-live-foreground border-status-live-border gap-1.5 px-2 py-0.5 text-[11px] font-medium"
                    >
                        <span className="size-1.5 rounded-full bg-status-live-foreground animate-pulse" />
                        Live Now
                    </Badge>
                );
            case "scheduled":
                if (isStartingSoon()) {
                    return (
                        <Badge
                            variant="outline"
                            className="bg-status-warn text-status-warn-foreground border-status-warn-border gap-1.5 px-2 py-0.5 text-[11px] font-medium"
                        >
                            <span className="size-1.5 rounded-full bg-status-warn-foreground" />
                            Starts &lt;15m
                        </Badge>
                    );
                }
                return (
                    <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[11px] font-medium">
                        <span className="size-1.5 rounded-full bg-primary" />
                        Scheduled
                    </Badge>
                );
            case "completed":
                return (
                    <Badge variant="outline" className="text-muted-foreground border-border px-2 py-0.5 text-[11px]">
                        Completed
                    </Badge>
                );
            case "cancelled":
                return (
                    <Badge variant="destructive" className="px-2 py-0.5 text-[11px]">
                        Cancelled
                    </Badge>
                );
            default:
                return null;
        }
    };

    const scheduledDate = meeting.scheduledAt ? new Date(meeting.scheduledAt) : null;
    const isValidDate = scheduledDate && !isNaN(scheduledDate.getTime());

    const isToday =
        isValidDate &&
        new Date().toDateString() === scheduledDate.toDateString();

    const formattedDate = isValidDate
        ? isToday
            ? `Today, ${scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
            : scheduledDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
              })
        : "Instant Room";

    const canJoin = meeting.status === "scheduled" || meeting.status === "ongoing";

    return (
        <div
            onClick={() => canJoin && onJoin(meeting.joinCode)}
            className="group relative flex flex-col justify-between rounded-lg border border-border bg-card text-card-foreground shadow-2xs transition-all hover:shadow-sm hover:border-primary/40 overflow-hidden cursor-pointer"
        >
            {/* Card Body */}
            <div className="p-4 space-y-2.5">
                {/* Top Header: Badges & Menu */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {getStatusBadge(meeting.status)}
                        {isRecurring && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                                <Repeat className="size-3" />
                                {formatRecurrenceBadge(meeting)}
                            </span>
                        )}
                        {isHost && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                                Host
                            </span>
                        )}
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    title="Meeting Actions"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs p-1">
                                <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer py-1.5">
                                    <Copy className="size-3.5" />
                                    <span>Copy Join Code</span>
                                </DropdownMenuItem>

                                {meeting.status === "scheduled" && onEdit && (
                                    <DropdownMenuItem
                                        onClick={() => onEdit(meeting)}
                                        className="gap-2 cursor-pointer py-1.5"
                                    >
                                        <Edit3 className="size-3.5" />
                                        <span>{isRecurring ? "Edit Series" : "Edit Meeting"}</span>
                                    </DropdownMenuItem>
                                )}

                                {meeting.status === "ongoing" && onEnd && isHost && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onEnd(meeting._id)}
                                            className="gap-2 cursor-pointer text-destructive focus:text-destructive py-1.5"
                                        >
                                            <XCircle className="size-3.5" />
                                            <span>End Live Meeting</span>
                                        </DropdownMenuItem>
                                    </>
                                )}

                                {meeting.status === "scheduled" && onCancel && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onCancel(meeting._id)}
                                            className="gap-2 cursor-pointer text-destructive focus:text-destructive py-1.5"
                                        >
                                            <XCircle className="size-3.5" />
                                            <span>{isRecurring ? "Cancel Series" : "Cancel Meeting"}</span>
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {meeting.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1 min-h-[32px]">
                        {meeting.description || "No description provided."}
                    </p>
                </div>

                {/* Date & Join Code Row */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{formattedDate}</span>
                        {meeting.duration && (
                            <>
                                <span>•</span>
                                <span>{meeting.duration}m</span>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 font-mono text-[11px] bg-muted/60 hover:bg-muted text-foreground border border-border px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Click to copy join code"
                    >
                        <span>{meeting.joinCode}</span>
                        {copied ? (
                            <Check className="size-3 text-status-live-foreground" />
                        ) : (
                            <Copy className="size-3 text-muted-foreground" />
                        )}
                    </button>
                </div>
            </div>

            {/* Card Footer: Matches ProjectsDashboard */}
            <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="capitalize font-medium">
                    {meeting.status === "ongoing"
                        ? "Session in progress"
                        : meeting.status === "scheduled"
                        ? isHost ? "You are hosting" : "Invited"
                        : `${meeting.status} session`}
                </span>

                {canJoin ? (
                    <div className="flex items-center gap-1 text-primary font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                        {meeting.status === "ongoing" ? (
                            <>
                                <Video className="w-3.5 h-3.5 text-status-live-foreground animate-pulse" />
                                <span>Join Live</span>
                            </>
                        ) : isHost ? (
                            <>
                                <Play className="w-3.5 h-3.5" />
                                <span>Start Meeting</span>
                            </>
                        ) : (
                            <>
                                <span>Join Meeting</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </div>
                ) : (
                    <span className="font-mono text-[10px] text-muted-foreground">
                        {meeting.joinCode}
                    </span>
                )}
            </div>
        </div>
    );
};

export default MeetingCard;
