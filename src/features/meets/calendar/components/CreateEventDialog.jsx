import React, { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Star, Loader2, Calendar } from "lucide-react";

export const CreateEventDialog = ({
    isOpen,
    onClose,
    onSubmit,
    loading,
    initialDate,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("event");
    const [priority, setPriority] = useState("medium");
    const [allDay, setAllDay] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        if (isOpen) {
            const base = initialDate || new Date();
            // Default to start of next hour
            const d = new Date(base);
            d.setMinutes(0, 0, 0);
            d.setHours(d.getHours() + 1);

            const offsetMs = d.getTimezoneOffset() * 60000;
            const localISOTime = new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
            setStartDate(localISOTime);

            const dEnd = new Date(d.getTime() + 60 * 60 * 1000);
            const localEnd = new Date(dEnd.getTime() - offsetMs).toISOString().slice(0, 16);
            setEndDate(localEnd);

            setTitle("");
            setDescription("");
            setCategory("event");
            setPriority("medium");
            setAllDay(false);
        }
    }, [isOpen, initialDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !startDate) return;

        const payload = {
            title: title.trim(),
            description: description.trim() || undefined,
            category,
            priority,
            allDay,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
        };

        await onSubmit(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-6 bg-card border-border shadow-xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <Star className="size-4" />
                        </span>
                        Add Workspace Event
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Schedule an important event, company milestone, deadline, or holiday.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="event-title" className="text-xs font-semibold">
                            Title *
                        </Label>
                        <Input
                            id="event-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Q4 Product Launch, Sprint Review, Company Holiday"
                            required
                            className="h-9 text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="event">General Event</SelectItem>
                                    <SelectItem value="milestone">Milestone</SelectItem>
                                    <SelectItem value="holiday">Holiday</SelectItem>
                                    <SelectItem value="deadline">Deadline</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                            id="all-day-checkbox"
                            checked={allDay}
                            onCheckedChange={setAllDay}
                        />
                        <Label htmlFor="all-day-checkbox" className="text-xs font-medium cursor-pointer">
                            All-day event
                        </Label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Start Date & Time *</Label>
                            <Input
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">End Date & Time</Label>
                            <Input
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="event-desc" className="text-xs font-semibold">
                            Description
                        </Label>
                        <Textarea
                            id="event-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add extra context or notes..."
                            className="text-xs min-h-[70px] resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-2 border-t border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={loading || !title.trim() || !startDate}
                            className="h-8 text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground shadow-xs"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            Create Event
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateEventDialog;
