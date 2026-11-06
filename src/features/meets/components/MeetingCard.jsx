import React, { useState } from "react";
import {
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-status-live-border bg-status-live px-2 py-0.5 text-[10px] font-medium text-status-live-foreground">
                        <span className="size-1.5 rounded-full bg-status-live-foreground animate-pulse" />
                        Live Now
                    </span>
                );
            case "scheduled":
                if (isStartingSoon()) {
                    return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-status-warn-border bg-status-warn px-2 py-0.5 text-[10px] font-medium text-status-warn-foreground">
                            <span className="size-1.5 rounded-full bg-status-warn-foreground" />
                            Starts &lt;15m
                        </span>
                    );
                }
                return (
                    <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-[10px] font-medium">
                        <span className="size-1.5 rounded-full bg-primary" />
                        Scheduled
                    </Badge>
                );
            case "completed":
                return (
                    <Badge variant="outline" className="text-muted-foreground border-border px-2 py-0.5 text-[10px]">
                        Completed
                    </Badge>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                        Cancelled
                    </span>
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

    const monthShort = isValidDate
        ? scheduledDate.toLocaleDateString("en-US", { month: "short" })
        : "NOW";
    const dayNum = isValidDate ? scheduledDate.getDate() : "•";

    const formattedTime = isValidDate
        ? isToday
            ? `Today · ${scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
            : scheduledDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
              })
        : "Instant Video Room";

    const canJoin = meeting.status === "scheduled" || meeting.status === "ongoing";

    return (
        <div
            onClick={() => canJoin && onJoin(meeting.joinCode)}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card text-card-foreground shadow-(--shadow-card) transition-all duration-150 hover:border-foreground/25 hover:-translate-y-0.5 overflow-hidden cursor-pointer"
        >
            {/* Card Body */}
            <div className="p-5 space-y-3.5">
                {/* Top Row: Status Badges & Actions Dropdown */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {getStatusBadge(meeting.status)}
                        {isRecurring && (
                            <Badge variant="outline" className="gap-1 text-[10px] font-normal px-1.5 py-0">
                                <Repeat className="size-2.5" />
                                {formatRecurrenceBadge(meeting)}
                            </Badge>
                        )}
                        {isHost && (
                            <Badge variant="outline" className="text-[10px] font-mono h-4 px-1.5 text-muted-foreground">
                                Host
                            </Badge>
                        )}
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                    title="Meeting Actions"
                                >
                                    <MoreHorizontal className="size-4" />
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

                {/* Middle Row: Calendar Date Badge + Title & Description */}
                <div className="flex items-start gap-3">
                    <div className="size-10 rounded-lg border border-border bg-muted/50 flex flex-col items-center justify-center shrink-0 text-center shadow-2xs">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground leading-none">
                            {monthShort}
                        </span>
                        <span className="text-xs font-bold font-mono tabular-nums text-foreground leading-tight mt-0.5">
                            {dayNum}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[14px] text-foreground truncate group-hover:text-primary transition-colors tracking-tight">
                            {meeting.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mt-0.5">
                            {meeting.description || "Video conference room & screen sharing."}
                        </p>
                    </div>
                </div>

                {/* Bottom Metadata Row: Schedule Time & One-Click Join Code Pill */}
                <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate font-mono tabular-nums text-[11px]">
                        <Calendar className="size-3 shrink-0" />
                        <span className="truncate">{formattedTime}</span>
                        {meeting.duration && (
                            <>
                                <span>·</span>
                                <span>{meeting.duration}m</span>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 font-mono tabular-nums text-[10px] bg-muted/60 hover:bg-muted text-foreground border border-border px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Click to copy join code"
                    >
                        <span>{meeting.joinCode}</span>
                        {copied ? (
                            <Check className="size-2.5 text-status-live-foreground" />
                        ) : (
                            <Copy className="size-2.5 text-muted-foreground" />
                        )}
                    </button>
                </div>
            </div>

            {/* Architectural Card Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/35 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="capitalize font-medium">
                    {meeting.status === "ongoing"
                        ? "Session in progress"
                        : meeting.status === "scheduled"
                        ? isHost
                            ? "You are hosting"
                            : "Invited"
                        : `${meeting.status} session`}
                </span>

                {canJoin ? (
                    <div className="flex items-center gap-1 text-foreground font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                        {meeting.status === "ongoing" ? (
                            <>
                                <Video className="size-3.5 text-status-live-foreground animate-pulse" />
                                <span className="text-status-live-foreground">Join Live</span>
                            </>
                        ) : isHost ? (
                            <>
                                <Play className="size-3 text-muted-foreground group-hover:text-foreground" />
                                <span>Start Room</span>
                            </>
                        ) : (
                            <>
                                <span>Join Room</span>
                                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
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
