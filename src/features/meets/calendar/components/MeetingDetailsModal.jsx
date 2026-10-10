import React, { useState } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Video,
    Repeat,
    Clock,
    Copy,
    Check,
    Calendar,
    Globe,
    Edit3,
    Ban,
    ArrowRight,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import useAuth from "@/features/auth/hooks/useAuth";

export const MeetingDetailsModal = ({
    isOpen,
    onClose,
    meeting,
    onJoin,
    onEdit,
    onCancel,
}) => {
    const { user } = useAuth();
    const currentUser = user?.user || user?.data || user;
    const currentUserId = currentUser?._id || currentUser?.id;

    const [copied, setCopied] = useState(false);

    if (!meeting) return null;

    const isRecurring = meeting.isRecurring || meeting.type === "recurring";
    const scheduledDate = meeting.scheduledAt ? new Date(meeting.scheduledAt) : null;
    const isHostOrCreator =
        meeting.hostId?.toString() === currentUserId?.toString() ||
        meeting.createdBy?.toString() === currentUserId?.toString();

    const handleCopyCode = () => {
        if (!meeting.joinCode) return;
        navigator.clipboard.writeText(meeting.joinCode);
        setCopied(true);
        toast.success("Join code copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-6 bg-card border-border shadow-xl">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                                isRecurring
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            }`}
                        >
                            {isRecurring ? (
                                <>
                                    <Repeat className="size-3 mr-1" />
                                    Recurring Series
                                </>
                            ) : (
                                <>
                                    <Video className="size-3 mr-1" />
                                    Scheduled Meeting
                                </>
                            )}
                        </Badge>

                        <Badge
                            variant="secondary"
                            className="text-xs uppercase font-mono tracking-wider"
                        >
                            {meeting.status}
                        </Badge>
                    </div>

                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-heading">
                        {meeting.title}
                    </DialogTitle>

                    {meeting.description && (
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                            {meeting.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Details Grid */}
                <div className="space-y-3 py-4 text-xs">
                    {/* Time & Date */}
                    {scheduledDate && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                            <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold text-foreground">
                                    {format(scheduledDate, "EEEE, MMMM d, yyyy")}
                                </span>
                                <div className="text-muted-foreground mt-0.5">
                                    {format(scheduledDate, "h:mm a")} ({meeting.duration || 30} minutes)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recurrence Rule */}
                    {isRecurring && meeting.recurrenceSummary && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-purple-400">
                            <Repeat className="size-4 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold">Recurrence Pattern</span>
                                <div className="text-muted-foreground text-[11px] mt-0.5">
                                    {meeting.recurrenceSummary}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Join Code */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div>
                            <span className="font-medium text-muted-foreground">Meeting Join Code</span>
                            <div className="font-mono text-sm font-bold text-foreground tracking-wider mt-0.5">
                                {meeting.joinCode}
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyCode}
                            className="h-8 gap-1.5 text-xs cursor-pointer"
                        >
                            {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                            {copied ? "Copied" : "Copy Code"}
                        </Button>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                    {isHostOrCreator && (
                        <div className="flex items-center gap-2 mr-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    onEdit && onEdit(meeting);
                                }}
                                className="h-8 gap-1 text-xs cursor-pointer"
                            >
                                <Edit3 className="size-3" />
                                Edit
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 text-xs cursor-pointer"
                    >
                        Close
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => {
                            onClose();
                            onJoin(meeting.joinCode);
                        }}
                        className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Video className="size-3.5" />
                        Join Room
                        <ArrowRight className="size-3" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MeetingDetailsModal;
