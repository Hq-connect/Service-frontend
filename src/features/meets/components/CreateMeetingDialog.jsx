import React, { useState } from "react";
import { Calendar, Video, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const CreateMeetingDialog = ({ isOpen, onClose, onSubmit, loading }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("scheduled"); // "scheduled" | "instant"
    const [scheduledAt, setScheduledAt] = useState("");
    const [duration, setDuration] = useState("30");
    const [timezone, setTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title,
            description: description.trim() || undefined,
            type,
            timezone,
            duration: parseInt(duration, 10),
        };

        if (type === "scheduled" && scheduledAt) {
            payload.scheduledAt = new Date(scheduledAt).toISOString();
        }

        await onSubmit(payload);
        setTitle("");
        setDescription("");
        setScheduledAt("");
        setType("scheduled");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg border-border bg-card text-card-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground font-heading">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Video className="size-4" />
                        </span>
                        New Meeting
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Schedule an upcoming conference or start an instant meeting with your team.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Meeting Type Selector */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg border border-border">
                        <Button
                            type="button"
                            variant={type === "scheduled" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setType("scheduled")}
                            className="gap-2"
                        >
                            <Calendar className="size-3.5" />
                            Scheduled
                        </Button>
                        <Button
                            type="button"
                            variant={type === "instant" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setType("instant")}
                            className="gap-2"
                        >
                            <Video className="size-3.5" />
                            Instant Meet
                        </Button>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="meeting-title" className="text-xs text-foreground">
                            Meeting Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="meeting-title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Product Sync"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="meeting-desc" className="text-xs text-foreground">
                            Description (Optional)
                        </Label>
                        <textarea
                            id="meeting-desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add meeting agenda or notes..."
                            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-foreground"
                        />
                    </div>

                    {/* Scheduled Date/Time if scheduled */}
                    {type === "scheduled" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="meeting-datetime" className="text-xs text-foreground">
                                Date & Time <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="meeting-datetime"
                                type="datetime-local"
                                required={type === "scheduled"}
                                value={scheduledAt}
                                min={new Date().toISOString().slice(0, 16)}
                                onChange={(e) => setScheduledAt(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Duration & Timezone Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="meeting-duration" className="text-xs text-foreground">
                                Duration
                            </Label>
                            <select
                                id="meeting-duration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                                <option value="120">2 hours</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="meeting-timezone" className="text-xs text-foreground">
                                Timezone
                            </Label>
                            <Input
                                id="meeting-timezone"
                                type="text"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-3 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={loading}
                            className="gap-2"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            {loading
                                ? "Creating..."
                                : type === "instant"
                                ? "Start Instant Meet"
                                : "Schedule Meeting"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateMeetingDialog;
