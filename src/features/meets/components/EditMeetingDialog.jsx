import React, { useState, useEffect } from "react";
import { Calendar, Loader2, Users, Search, X, Clock, Globe, AlertCircle, Edit3 } from "lucide-react";
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
import meetingService from "../services/meeting.service";

export const EditMeetingDialog = ({ isOpen, onClose, meeting, onUpdate, loading }) => {
    const { user } = useAuth();
    const currentUser = user?.user || user?.data || user;
    const currentUserId = currentUser?._id || currentUser?.id;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [duration, setDuration] = useState("30");
    const [timezone, setTimezone] = useState("UTC");

    // Attendees state
    const [attendeeSearch, setAttendeeSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    // Populate existing values when dialog opens or meeting changes
    useEffect(() => {
        if (meeting && isOpen) {
            setTitle(meeting.title || "");
            setDescription(meeting.description || "");
            setDuration(meeting.duration ? String(meeting.duration) : "30");
            setTimezone(meeting.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

            if (meeting.scheduledAt) {
                const date = new Date(meeting.scheduledAt);
                // Convert to local YYYY-MM-DDTHH:mm for datetime-local input
                const offset = date.getTimezoneOffset() * 60000;
                const localISODate = new Date(date.getTime() - offset).toISOString().slice(0, 16);
                setScheduledAt(localISODate);
            } else {
                setScheduledAt("");
            }

            // Fetch existing participants
            const fetchExistingParticipants = async () => {
                try {
                    setLoadingParticipants(true);
                    const res = await meetingService.getParticipants(meeting._id);
                    const parts = res?.data?.participants || [];
                    const hostId = meeting.hostId || meeting.createdBy;

                    // Filter out host and map to user format
                    const nonHostParticipants = parts
                        .filter((p) => p.userId && p.userId.toString() !== hostId?.toString())
                        .map((p) => {
                            if (typeof p.userId === "object" && p.userId !== null) {
                                return p.userId;
                            }
                            return {
                                _id: p.userId,
                                name: p.userName || "Participant",
                                firstName: p.userName || "Participant",
                                email: "",
                            };
                        });

                    setSelectedUsers(nonHostParticipants);
                } catch (err) {
                    console.warn("Could not load participants for editing:", err.message);
                } finally {
                    setLoadingParticipants(false);
                }
            };

            fetchExistingParticipants();
        }
    }, [meeting, isOpen]);

    const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
        search: attendeeSearch,
        status: "active",
        limit: 30,
        enabled: isOpen,
    });

    const rawUsersList = Array.isArray(tenantUsers) ? tenantUsers : (tenantUsers?.users || []);
    const availableUsers = rawUsersList.filter(
        (u) =>
            u._id !== currentUserId &&
            u._id !== (meeting?.createdBy?._id || meeting?.createdBy) &&
            !selectedUsers.some((sel) => sel._id === u._id)
    );

    const handleAddUser = (userItem) => {
        setSelectedUsers((prev) => [...prev, userItem]);
        setAttendeeSearch("");
        setIsSearchOpen(false);
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!meeting?._id) return;

        const payload = {
            title,
            description: description.trim() || undefined,
            duration: parseInt(duration, 10),
            timezone,
            participantIds: selectedUsers.map((u) => u._id),
        };

        if (scheduledAt) {
            payload.scheduledAt = new Date(scheduledAt).toISOString();
            payload.scheduledStartAt = new Date(scheduledAt).toISOString();
        }

        await onUpdate(meeting._id, payload);
        onClose();
    };

    const getUserInitials = (u) => {
        const first = u.firstName ? u.firstName[0] : "";
        const last = u.lastName ? u.lastName[0] : "";
        return (first + last).toUpperCase() || (u.email ? u.email[0].toUpperCase() : "U");
    };

    const getUserDisplayName = (u) => {
        const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
        return full || u.name || u.email || "Member";
    };

    if (!isOpen || !meeting) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg border-border bg-card text-card-foreground max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground font-heading">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Edit3 className="size-4" />
                        </span>
                        Reschedule & Edit Meeting
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Change the meeting time, agenda, or attendees in real-time. Attendees will receive a notification.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Notice Banner */}
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs leading-relaxed">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span>
                            Rescheduling will recalculate reminder timers (15 mins prior & start time) and automatically send an updated notification to all attendees.
                        </span>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-title" className="text-xs text-foreground font-medium">
                            Meeting Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="edit-title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Weekly Product Sync"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-desc" className="text-xs text-foreground font-medium">
                            Description (Optional)
                        </Label>
                        <textarea
                            id="edit-desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add meeting agenda or notes..."
                            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-foreground"
                        />
                    </div>

                    {/* Scheduled Date/Time */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-datetime" className="text-xs text-foreground font-medium flex items-center gap-1.5">
                            <Calendar className="size-3 text-primary" />
                            Scheduled Date & Time <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="edit-datetime"
                            type="datetime-local"
                            required
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                        />
                    </div>

                    {/* Duration & Timezone Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-duration" className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Clock className="size-3 text-muted-foreground" />
                                Duration
                            </Label>
                            <select
                                id="edit-duration"
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
                            <Label htmlFor="edit-timezone" className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Globe className="size-3 text-muted-foreground" />
                                Timezone
                            </Label>
                            <Input
                                id="edit-timezone"
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
                                Manage Attendees ({selectedUsers.length})
                            </Label>
                            {loadingParticipants && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="size-2.5 animate-spin" />
                                    Loading...
                                </span>
                            )}
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
                                    placeholder="Search by name or email to add..."
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
                                                : "No other members available to add."}
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
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditMeetingDialog;
