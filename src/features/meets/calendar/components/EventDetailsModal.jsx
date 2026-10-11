import React from "react";
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
import { Star, Clock, Trash2, Calendar, Loader2 } from "lucide-react";

export const EventDetailsModal = ({
    isOpen,
    onClose,
    event,
    onDelete,
    isDeleting,
}) => {
    if (!event) return null;

    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-6 bg-card border-border shadow-xl">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs font-medium"
                        >
                            <Star className="size-3 mr-1" />
                            {event.category || "Event"}
                        </Badge>
                        {event.priority && (
                            <Badge
                                variant="secondary"
                                className={`text-[10px] uppercase font-mono ${
                                    event.priority === "high"
                                        ? "text-red-500 bg-red-500/10"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {event.priority} priority
                            </Badge>
                        )}
                    </div>

                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-heading">
                        {event.title}
                    </DialogTitle>

                    {event.description && (
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                            {event.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-3 py-4 text-xs">
                    {startDate && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                            <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold text-foreground">
                                    {format(startDate, "EEEE, MMMM d, yyyy")}
                                </span>
                                <div className="text-muted-foreground mt-0.5">
                                    {event.allDay
                                        ? "All Day"
                                        : `${format(startDate, "h:mm a")}${
                                              endDate ? ` – ${format(endDate, "h:mm a")}` : ""
                                          }`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(event._id)}
                        disabled={isDeleting}
                        className="h-8 gap-1.5 text-xs mr-auto cursor-pointer"
                    >
                        {isDeleting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="size-3.5" />
                        )}
                        Delete Event
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="h-8 text-xs cursor-pointer"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EventDetailsModal;
