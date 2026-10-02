import React, { useState } from "react";
import { Calendar, Video, Loader2, Users, Search, X, Check, Clock, Globe } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/global/hooks/useUsers";
import useAuth from "@/features/auth/hooks/useAuth";
import { getUserInitials, getUserDisplayName } from "@/global/utils/user";

export const CreateMeetingDialog = ({ isOpen, onClose, onSubmit, loading }) => {
    const { user } = useAuth();
    const currentUser = user?.user || user?.data || user;
    const currentUserId = currentUser?._id || currentUser?.id;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("scheduled"); // "scheduled" | "instant"
    const [scheduledAt, setScheduledAt] = useState("");
    const [duration, setDuration] = useState("30");
    const [timezone, setTimezone] = useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    );

    // Attendee selection state
    const [attendeeSearch, setAttendeeSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
        search: attendeeSearch,
        status: "active",
        limit: 30,
        enabled: isOpen,
    });

    const rawUsersList = Array.isArray(tenantUsers) ? tenantUsers : (tenantUsers?.users || []);
    const availableUsers = rawUsersList.filter(
        (u) => u._id !== currentUserId && !selectedUsers.some((sel) => sel._id === u._id)
    );

    const handleAddUser = (userItem) => {
        setSelectedUsers((prev) => [...prev, userItem]);
        setAttendeeSearch("");
        setIsSearchOpen(false);
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setScheduledAt("");
        setType("scheduled");
        setDuration("30");
        setSelectedUsers([]);
        setAttendeeSearch("");
        setIsSearchOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title,
            description: description.trim() || undefined,
            type,
            timezone,
            duration: parseInt(duration, 10),
            participantIds: selectedUsers.map((u) => u._id),
        };

        if (type === "scheduled" && scheduledAt) {
            payload.scheduledAt = new Date(scheduledAt).toISOString();
        }

        await onSubmit(payload);
        resetForm();
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    resetForm();
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-lg border-border bg-card text-card-foreground max-h-[92vh] overflow-y-auto">
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
                        <Label htmlFor="meeting-title" className="text-xs text-foreground font-medium">
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
                        <Label htmlFor="meeting-desc" className="text-xs text-foreground font-medium">
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
                            <Label htmlFor="meeting-datetime" className="text-xs text-foreground font-medium">
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
                            <Label htmlFor="meeting-duration" className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Clock className="size-3 text-muted-foreground" />
                                Duration
                            </Label>
                            <select
                                id="meeting-duration"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                            <Label htmlFor="meeting-timezone" className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Globe className="size-3 text-muted-foreground" />
                                Timezone
                            </Label>
                            <Input
                                id="meeting-timezone"
                                type="text"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="text-xs h-9"
                            />
                        </div>
                    </div>

                    {/* Organization Attendees Selection */}
                    <div className="space-y-2 pt-1 border-t border-border">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Users className="size-3.5 text-primary" />
                                Invite Organization Members ({selectedUsers.length})
                            </Label>
                            <span className="text-[10px] text-muted-foreground">
                                Will receive automated reminders
                            </span>
                        </div>

                        {/* Selected Attendees Chips */}
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg border border-border/60 max-h-28 overflow-y-auto">
                                {selectedUsers.map((attendee) => (
                                    <div
                                        key={attendee._id}
                                        className="inline-flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-md text-xs text-foreground shadow-xs animate-in fade-in"
                                    >
                                        <Avatar className="size-4">
                                            <AvatarImage src={attendee.avatar} />
                                            <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-semibold">
                                                {getUserInitials(attendee)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="max-w-[120px] truncate text-[11px] font-medium">
                                            {getUserDisplayName(attendee)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUser(attendee._id)}
                                            className="text-muted-foreground hover:text-destructive rounded-xs transition-colors p-0.5"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Member Search Input */}
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={attendeeSearch}
                                    onFocus={() => setIsSearchOpen(true)}
                                    onChange={(e) => {
                                        setAttendeeSearch(e.target.value);
                                        setIsSearchOpen(true);
                                    }}
                                    placeholder="Search by name or email to invite..."
                                    className="pl-8 text-xs h-9"
                                />
                                {attendeeSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setAttendeeSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {isSearchOpen && (
                                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl p-1 text-popover-foreground text-xs">
                                    {isLoadingUsers ? (
                                        <div className="flex items-center justify-center p-3 text-muted-foreground gap-2">
                                            <Loader2 className="size-3.5 animate-spin text-primary" />
                                            <span>Searching members...</span>
                                        </div>
                                    ) : availableUsers.length > 0 ? (
                                        availableUsers.map((item) => (
                                            <button
                                                key={item._id}
                                                type="button"
                                                onClick={() => handleAddUser(item)}
                                                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted text-left transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Avatar className="size-6">
                                                        <AvatarImage src={item.avatar} />
                                                        <AvatarFallback className="text-[10px] bg-muted-foreground/20 text-foreground font-semibold">
                                                            {getUserInitials(item)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-foreground truncate leading-tight">
                                                            {getUserDisplayName(item)}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground truncate">
                                                            {item.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                                    + Add
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-muted-foreground text-[11px]">
                                            {attendeeSearch
                                                ? "No members match your search."
                                                : "No other members available in organization."}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-3 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
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
