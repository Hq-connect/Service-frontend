import React, { useState } from "react";
import { Calendar, Clock, Copy, Check, Video, XCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const MeetingCard = ({ meeting, onJoin, onCancel, onEnd }) => {
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
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 animate-pulse">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Live Now
                    </Badge>
                );
            case "scheduled":
                return (
                    <Badge variant="secondary" className="gap-1.5">
                        <span className="size-1.5 rounded-full bg-primary" />
                        Scheduled
                    </Badge>
                );
            case "completed":
                return (
                    <Badge variant="outline" className="text-muted-foreground">
                        Completed
                    </Badge>
                );
            case "cancelled":
                return (
                    <Badge variant="destructive">
                        Cancelled
                    </Badge>
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
        <Card className="group relative flex flex-col justify-between border-border bg-card text-card-foreground hover:shadow-md transition-all duration-200">
            <div>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2 space-y-0">
                    <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {meeting.title}
                    </CardTitle>
                    {getStatusBadge(meeting.status)}
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                    {meeting.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {meeting.description}
                        </p>
                    )}

                    <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="size-3.5 text-muted-foreground/70" />
                            <span>{formatDate(meeting.scheduledAt)}</span>
                        </div>

                        {meeting.duration && (
                            <div className="flex items-center gap-2">
                                <Clock className="size-3.5 text-muted-foreground/70" />
                                <span>{meeting.duration} minutes</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                            <Users className="size-3.5 text-muted-foreground/70" />
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground text-xs flex items-center gap-1.5 border border-border">
                                {meeting.joinCode}
                                <button
                                    onClick={handleCopy}
                                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                                    title="Copy join code"
                                >
                                    {copied ? (
                                        <Check className="size-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="size-3" />
                                    )}
                                </button>
                            </span>
                        </div>
                    </div>
                </CardContent>
            </div>

            <CardFooter className="flex items-center gap-2 pt-3 border-t border-border bg-transparent">
                {(meeting.status === "scheduled" || meeting.status === "ongoing") && (
                    <Button
                        onClick={() => onJoin(meeting.joinCode)}
                        className="flex-1 gap-2"
                        size="sm"
                    >
                        <Video className="size-3.5" />
                        Join Meeting
                    </Button>
                )}

                {meeting.status === "ongoing" && onEnd && (
                    <Button
                        onClick={() => onEnd(meeting._id)}
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        title="End Live Meeting"
                    >
                        <XCircle className="size-3.5" />
                        <span>End</span>
                    </Button>
                )}

                {meeting.status === "scheduled" && onCancel && (
                    <Button
                        onClick={() => onCancel(meeting._id)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive gap-1.5"
                        title="Cancel Meeting"
                    >
                        <XCircle className="size-3.5" />
                        <span>Cancel</span>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default MeetingCard;
