import React, { useState, useEffect } from "react";
import {
    Calendar,
    Loader2,
    Users,
    Search,
    X,
    Clock,
    Globe,
    AlertCircle,
    Edit3,
    Repeat,
    RefreshCw,
} from "lucide-react";
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
import meetingService from "../services/meeting.service";
import { DAYS_OF_WEEK, getRecurrenceSummaryText } from "../utils/recurrenceUtils";

export const EditMeetingDialog = ({ isOpen, onClose, meeting, onUpdate, loading }) => {
    const { user } = useAuth();
    const currentUser = user?.user || user?.data || user;
    const currentUserId = currentUser?._id || currentUser?.id;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [duration, setDuration] = useState("30");
    const [timezone, setTimezone] = useState("UTC");

    // Periodic / Recurrence state
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState("WEEKLY");
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([new Date().getDay()]);
    const [recurrenceEndType, setRecurrenceEndType] = useState("never");
    const [recurrenceUntil, setRecurrenceUntil] = useState("");

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
            setTimezone(
                meeting.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
            );

            if (meeting.scheduledAt) {
                const date = new Date(meeting.scheduledAt);
                const offset = date.getTimezoneOffset() * 60000;
                const localISODate = new Date(date.getTime() - offset).toISOString().slice(0, 16);
                setScheduledAt(localISODate);
            } else {
                setScheduledAt("");
            }

            // Recurrence fields initialization
            const hasRecurrence = Boolean(
                meeting.recurrenceType && meeting.recurrenceType !== "NONE"
            );
            setIsRecurring(hasRecurrence);
            setRecurrenceType(hasRecurrence ? meeting.recurrenceType : "WEEKLY");
            setRecurrenceInterval(meeting.recurrence?.interval || 1);

            if (Array.isArray(meeting.recurrence?.daysOfWeek) && meeting.recurrence.daysOfWeek.length > 0) {
                setSelectedDaysOfWeek(meeting.recurrence.daysOfWeek);
            } else if (meeting.scheduledAt) {
                setSelectedDaysOfWeek([new Date(meeting.scheduledAt).getDay()]);
            } else {
                setSelectedDaysOfWeek([new Date().getDay()]);
            }

            if (meeting.recurrence?.until) {
                setRecurrenceEndType("until");
                setRecurrenceUntil(new Date(meeting.recurrence.until).toISOString().slice(0, 10));
            } else {
                setRecurrenceEndType("never");
                setRecurrenceUntil("");
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

    const handleDateChange = (val) => {
        setScheduledAt(val);
        if (val) {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
                const day = date.getDay();
                if (isRecurring && selectedDaysOfWeek.length <= 1) {
                    setSelectedDaysOfWeek([day]);
                }
            }
        }
    };

    const toggleDayOfWeek = (dayNumber) => {
        setSelectedDaysOfWeek((prev) => {
            if (prev.includes(dayNumber)) {
                if (prev.length === 1) return prev;
                return prev.filter((d) => d !== dayNumber);
            }
            return [...prev, dayNumber].sort((a, b) => a - b);
        });
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

        if (isRecurring) {
            payload.recurrenceType = recurrenceType;
            payload.recurrence = {
                interval: Math.max(1, parseInt(recurrenceInterval, 10) || 1),
                daysOfWeek: recurrenceType === "WEEKLY" ? selectedDaysOfWeek : [],
                until:
                    recurrenceEndType === "until" && recurrenceUntil
                        ? new Date(recurrenceUntil).toISOString()
                        : null,
            };
        } else {
            payload.recurrenceType = "NONE";
            payload.recurrence = { interval: 1 };
        }

        await onUpdate(meeting._id, payload);
        onClose();
    };

    if (!isOpen || !meeting) return null;

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-lg border-border bg-card text-card-foreground max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground font-heading">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Edit3 className="size-4" />
                        </span>
                        Reschedule / Edit Meeting
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Update meeting time, periodic recurrence schedule, or manage attendees.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-meeting-title" className="text-xs text-foreground font-medium">
                            Meeting Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="edit-meeting-title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Meeting title"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-meeting-desc" className="text-xs text-foreground font-medium">
                            Description (Optional)
                        </Label>
                        <textarea
                            id="edit-meeting-desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add meeting agenda or notes..."
                            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-foreground"
                        />
                    </div>

                    {/* Scheduled Date/Time */}
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-meeting-datetime" className="text-xs text-foreground font-medium flex items-center justify-between">
                            <span>
                                Date & Time <span className="text-destructive">*</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                                Rescheduling triggers real-time attendee notification
                            </span>
                        </Label>
                        <Input
                            id="edit-meeting-datetime"
                            type="datetime-local"
                            required
                            value={scheduledAt}
                            onChange={(e) => handleDateChange(e.target.value)}
                        />
                    </div>

                    {/* Recurrence / Periodic Meeting Section */}
                    <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                                    <Repeat className="size-3.5" />
                                </div>
                                <div>
                                    <Label htmlFor="edit-recurrence-toggle" className="text-xs text-foreground font-semibold cursor-pointer">
                                        Recurring / Periodic Schedule
                                    </Label>
                                    <p className="text-[10px] text-muted-foreground">
                                        Adjust periodicity, time, or frequency
                                    </p>
                                </div>
                            </div>
                            <input
                                id="edit-recurrence-toggle"
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="size-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Recurrence Details Options */}
                        {isRecurring && (
                            <div className="space-y-3 pt-2 border-t border-border/60 animate-in fade-in slide-in-from-top-1 duration-200">
                                {/* Frequency Switcher */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-muted-foreground font-medium">
                                        Frequency
                                    </Label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {["DAILY", "WEEKLY", "MONTHLY"].map((freq) => (
                                            <Button
                                                key={freq}
                                                type="button"
                                                size="sm"
                                                variant={recurrenceType === freq ? "default" : "outline"}
                                                className="h-8 text-xs capitalize"
                                                onClick={() => setRecurrenceType(freq)}
                                            >
                                                {freq.toLowerCase()}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Weekly Days of Week Picker */}
                                {recurrenceType === "WEEKLY" && (
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-muted-foreground font-medium">
                                            Repeat On
                                        </Label>
                                        <div className="flex items-center justify-between gap-1">
                                            {DAYS_OF_WEEK.map((item) => {
                                                const isSelected = selectedDaysOfWeek.includes(item.day);
                                                return (
                                                    <button
                                                        key={item.day}
                                                        type="button"
                                                        title={item.name}
                                                        onClick={() => toggleDayOfWeek(item.day)}
                                                        className={`size-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer border ${
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                                                : "bg-background text-muted-foreground border-border hover:bg-muted"
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Interval & Ends In */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground font-medium">
                                            Every
                                        </Label>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="52"
                                                value={recurrenceInterval}
                                                onChange={(e) => setRecurrenceInterval(e.target.value)}
                                                className="h-8 text-xs w-16 text-center"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {recurrenceType === "DAILY"
                                                    ? "day(s)"
                                                    : recurrenceType === "WEEKLY"
                                                    ? "week(s)"
                                                    : "month(s)"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground font-medium">
                                            Ends
                                        </Label>
                                        <select
                                            value={recurrenceEndType}
                                            onChange={(e) => setRecurrenceEndType(e.target.value)}
                                            className="h-8 w-full rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
                                        >
                                            <option value="never">Never (Ongoing)</option>
                                            <option value="until">On Specific Date</option>
                                        </select>
                                    </div>
                                </div>

                                {/* If specific end date */}
                                {recurrenceEndType === "until" && (
                                    <div className="space-y-1">
                                        <Label className="text-[11px] text-muted-foreground font-medium">
                                            End Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={recurrenceUntil}
                                            min={new Date().toISOString().slice(0, 10)}
                                            onChange={(e) => setRecurrenceUntil(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}

                                {/* Live Dynamic Recurrence Summary */}
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                                    <RefreshCw className="size-3.5 shrink-0" />
                                    <span className="truncate">
                                        {getRecurrenceSummaryText({
                                            recurrenceType,
                                            interval: recurrenceInterval,
                                            daysOfWeek: selectedDaysOfWeek,
                                            scheduledAt,
                                            until: recurrenceEndType === "until" ? recurrenceUntil : null,
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Duration & Timezone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-meeting-duration" className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Clock className="size-3 text-muted-foreground" />
                                Duration
                            </Label>
                            <select
                                id="edit-meeting-duration"
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
                            <Label htmlFor="edit-meeting-timezone" className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Globe className="size-3 text-muted-foreground" />
                                Timezone
                            </Label>
                            <Input
                                id="edit-meeting-timezone"
                                type="text"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="text-xs h-9"
                            />
                        </div>
                    </div>

                    {/* Organization Attendees Section */}
                    <div className="space-y-2 pt-1 border-t border-border">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
                                <Users className="size-3.5 text-primary" />
                                Manage Attendees ({selectedUsers.length})
                            </Label>
                            {loadingParticipants && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" /> Loading attendees...
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
                                            className="text-muted-foreground hover:text-destructive rounded-full p-0.5 transition-colors"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Search and Add Attendees */}
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                                <Input
                                    value={attendeeSearch}
                                    onChange={(e) => {
                                        setAttendeeSearch(e.target.value);
                                        setIsSearchOpen(true);
                                    }}
                                    onFocus={() => setIsSearchOpen(true)}
                                    placeholder="Search colleague to add to meeting..."
                                    className="pl-8 text-xs h-9"
                                />
                            </div>

                            {/* Dropdown list of users */}
                            {isSearchOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsSearchOpen(false)}
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-44 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-50 py-1">
                                        {isLoadingUsers ? (
                                            <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                                Loading members...
                                            </div>
                                        ) : availableUsers.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-muted-foreground">
                                                {attendeeSearch.trim()
                                                    ? "No matching organization members found"
                                                    : "All members added"}
                                            </div>
                                        ) : (
                                            availableUsers.map((userItem) => (
                                                <div
                                                    key={userItem._id}
                                                    onClick={() => handleAddUser(userItem)}
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-muted/80 cursor-pointer text-xs transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="size-5">
                                                            <AvatarImage src={userItem.avatar} />
                                                            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                                                {getUserInitials(userItem)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-foreground">
                                                                {getUserDisplayName(userItem)}
                                                            </div>
                                                            {userItem.email && (
                                                                <div className="text-[10px] text-muted-foreground">
                                                                    {userItem.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-primary hover:underline">
                                                        Add
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-2 gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={loading} className="gap-2">
                            {loading ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Edit3 className="size-3.5" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditMeetingDialog;
