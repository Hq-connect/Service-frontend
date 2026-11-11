import React, { useState, useEffect, useMemo } from "react";
import {
    Users,
    Search,
    UserPlus,
    X,
    Lock,
    Globe,
    Check,
    Loader2,
    Shield,
    Trash2,
    Share2,
    AlertCircle,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUsers } from "@/global/hooks/useUsers";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { getUserInitials, getUserDisplayName, getAvatarStyle, extractUser } from "@/global/utils/user";
import meetingService from "../services/meeting.service";

/**
 * Reusable Share Recording Section
 * Can be embedded inside the player modal or displayed in a standalone dialog.
 */
export const ShareRecordingSection = ({
    recording,
    onShared,
    onClose,
    isEmbedded = false,
}) => {
    const { currentUser, currentUserId } = useCurrentUser();
    const [userSearch, setUserSearch] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialise selected users from recording.sharedUsers or recording.sharedWith
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [initialUserIds, setInitialUserIds] = useState([]);

    const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
        search: userSearch,
        status: "active",
        limit: 50,
        enabled: Boolean(recording?._id),
    });

    const rawUsersList = useMemo(() => {
        return Array.isArray(tenantUsers) ? tenantUsers : (tenantUsers?.users || []);
    }, [tenantUsers]);

    // Populate initial state from recording
    useEffect(() => {
        if (!recording) return;

        const sharedUsersList = Array.isArray(recording.sharedUsers) ? recording.sharedUsers : [];
        const sharedWithIds = (Array.isArray(recording.sharedWith) ? recording.sharedWith : []).map(
            (id) => (id?._id || id)?.toString()
        );

        const mapped = [];

        // First use sharedUsers objects if available
        sharedUsersList.forEach((su) => {
            const uId = (su.userId?._id || su.userId || su._id || su.id)?.toString();
            if (uId && !mapped.some((m) => m._id === uId)) {
                mapped.push({
                    _id: uId,
                    id: uId,
                    name: su.name || su.fullName || su.userName || "Colleague",
                    email: su.email || "",
                    avatar: su.avatar || "",
                    role: su.role || "viewer",
                });
            }
        });

        // If there are sharedWith IDs not in sharedUsers, match from tenantUsers
        sharedWithIds.forEach((id) => {
            if (!mapped.some((m) => m._id === id)) {
                const found = rawUsersList.find((u) => (u._id || u.id)?.toString() === id);
                if (found) {
                    mapped.push(found);
                } else {
                    mapped.push({
                        _id: id,
                        id,
                        name: "Workspace Member",
                        email: "",
                        avatar: "",
                        role: "viewer",
                    });
                }
            }
        });

        setSelectedUsers(mapped);
        setInitialUserIds(sharedWithIds);
    }, [recording, rawUsersList]);

    // Filter available workspace users to pick from
    const availableUsers = useMemo(() => {
        return rawUsersList.filter((u) => {
            const uid = (u._id || u.id)?.toString();
            // Do not show the current host / recorder
            if (uid === currentUserId?.toString()) return false;
            if (recording?.recordedBy && uid === (recording.recordedBy?._id || recording.recordedBy)?.toString()) return false;
            // Exclude already selected
            return !selectedUsers.some((sel) => (sel._id || sel.id)?.toString() === uid);
        });
    }, [rawUsersList, currentUserId, recording, selectedUsers]);

    const hasChanges = useMemo(() => {
        const currentIds = selectedUsers.map((u) => (u._id || u.id)?.toString()).sort();
        const initial = [...initialUserIds].sort();
        if (currentIds.length !== initial.length) return true;
        return currentIds.some((id, idx) => id !== initial[idx]);
    }, [selectedUsers, initialUserIds]);

    const handleAddUser = (userItem) => {
        setSelectedUsers((prev) => [...prev, userItem]);
        setUserSearch("");
        setIsSearchOpen(false);
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers((prev) => prev.filter((u) => (u._id || u.id)?.toString() !== userId?.toString()));
    };

    const handleClearAll = () => {
        setSelectedUsers([]);
    };

    const handleSavePermissions = async () => {
        if (!recording?._id) return;
        setIsSaving(true);
        try {
            const userIds = selectedUsers.map((u) => (u._id || u.id)?.toString());
            const sharedUsersData = selectedUsers.map((u) => ({
                userId: u._id || u.id,
                name: getUserDisplayName(u),
                email: u.email || "",
                avatar: u.avatar || "",
                role: u.role || "viewer",
            }));

            const res = await meetingService.shareRecording(recording._id, {
                sharedWith: userIds,
                sharedUsers: sharedUsersData,
            });

            toast.success(
                userIds.length > 0
                    ? `Recording shared with ${userIds.length} workspace ${userIds.length === 1 ? "member" : "members"}`
                    : "Recording is now private to meeting owner"
            );

            const updatedRec = res?.data?.recording || {
                ...recording,
                sharedWith: userIds,
                sharedUsers: sharedUsersData,
            };

            setInitialUserIds(userIds);
            if (onShared) {
                onShared(updatedRec);
            }
            if (onClose && !isEmbedded) {
                onClose();
            }
        } catch (err) {
            console.error("Failed to update recording sharing permissions:", err);
            toast.error(err?.response?.data?.message || "Failed to update sharing permissions");
        } finally {
            setIsSaving(false);
        }
    };

    const hostName = recording?.recorderName || "Meeting Host";

    return (
        <div className={`space-y-4 ${isEmbedded ? "p-4 bg-muted/20 border-t border-border" : ""}`}>
            {/* Context Heading */}
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Users className="size-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">
                            Share with Workspace Members
                        </h4>
                        {selectedUsers.length > 0 ? (
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1 font-mono">
                                <Users className="size-2.5" />
                                {selectedUsers.length} shared
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] bg-muted/60 text-muted-foreground border-border gap-1 font-mono">
                                <Lock className="size-2.5" />
                                Private
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Select who in this workspace can watch and download this recording. Unselected users cannot access it.
                    </p>
                </div>

                {selectedUsers.length > 0 && (
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleClearAll}
                        className="text-[11px] text-muted-foreground hover:text-destructive h-7 px-2"
                        title="Remove all shared access and make recording private"
                    >
                        Make Private
                    </Button>
                )}
            </div>

            {/* Host / Owner Info Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/80 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                        <Shield className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                            {hostName} <span className="text-[10px] text-muted-foreground">(Recording Owner)</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">Full owner & management permissions</p>
                    </div>
                </div>
                <Badge variant="secondary" className="text-[10px] font-medium shrink-0">
                    Host
                </Badge>
            </div>

            {/* Search & Select Workspace Members */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                        value={userSearch}
                        onChange={(e) => {
                            setUserSearch(e.target.value);
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        placeholder="Search workspace colleague by name or email..."
                        className="pl-8 text-xs h-9 bg-background"
                    />
                    {userSearch && (
                        <button
                            type="button"
                            onClick={() => setUserSearch("")}
                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Dropdown list of workspace users */}
                {isSearchOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsSearchOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                                    <Loader2 className="size-3.5 animate-spin mr-1.5 text-primary" />
                                    Loading workspace members...
                                </div>
                            ) : availableUsers.length === 0 ? (
                                <div className="p-3 text-center text-xs text-muted-foreground">
                                    {userSearch.trim()
                                        ? "No matching workspace members found"
                                        : "All workspace members have access"}
                                </div>
                            ) : (
                                availableUsers.map((userItem) => (
                                    <div
                                        key={userItem._id || userItem.id}
                                        onClick={() => handleAddUser(userItem)}
                                        className="flex items-center justify-between px-3 py-2 hover:bg-muted/80 cursor-pointer text-xs transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Avatar className="size-6 shrink-0 border border-border">
                                                <AvatarImage src={userItem.avatar} />
                                                <AvatarFallback style={getAvatarStyle(userItem)} className="text-[10px] font-semibold">
                                                    {getUserInitials(userItem)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 text-left">
                                                <p className="font-medium text-foreground truncate">
                                                    {getUserDisplayName(userItem)}
                                                </p>
                                                {userItem.email && (
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {userItem.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 text-[11px] text-primary font-medium shrink-0 ml-2">
                                            <UserPlus className="size-3.5" />
                                            <span>Add</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Currently Shared Members List */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                    <span>Authorized Workspace Members ({selectedUsers.length})</span>
                    <span className="text-[10px]">Can watch & download</span>
                </div>

                {selectedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-5 rounded-lg border border-dashed border-border bg-muted/10 text-center space-y-1.5">
                        <Lock className="size-5 text-muted-foreground/60" />
                        <p className="text-xs font-medium text-foreground">Private to Meeting Owner</p>
                        <p className="text-[11px] text-muted-foreground max-w-xs">
                            No other workspace members have been granted access. Search above to share this video.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedUsers.map((userItem) => {
                            const uid = userItem._id || userItem.id;
                            return (
                                <div
                                    key={uid}
                                    className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs group hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="size-6 shrink-0 border border-border">
                                            <AvatarImage src={userItem.avatar} />
                                            <AvatarFallback style={getAvatarStyle(userItem)} className="text-[10px] font-semibold">
                                                {getUserInitials(userItem)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 text-left">
                                            <p className="font-medium text-foreground truncate">
                                                {getUserDisplayName(userItem)}
                                            </p>
                                            {userItem.email && (
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {userItem.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/40">
                                            Can View
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => handleRemoveUser(uid)}
                                            className="text-muted-foreground hover:text-destructive size-6"
                                            title="Revoke access"
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                <span className="text-[11px] text-muted-foreground">
                    {hasChanges ? "Unsaved permission changes" : "Permissions are up to date"}
                </span>

                <div className="flex items-center gap-2">
                    {onClose && !isEmbedded && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-xs h-8"
                        >
                            Cancel
                        </Button>
                    )}

                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSavePermissions}
                        disabled={isSaving || !hasChanges}
                        className="text-xs h-8 gap-1.5"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Check className="size-3.5" />
                                <span>Save Permissions</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

/**
 * Standalone Dialog for Sharing Recording
 */
export const ShareRecordingModal = ({
    recording,
    isOpen,
    onClose,
    onShared,
}) => {
    if (!recording) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md p-5 border-border bg-card text-card-foreground">
                <DialogHeader className="text-left pb-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <Share2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle className="text-base font-semibold text-foreground truncate font-heading">
                                Share Recording
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground truncate">
                                {recording.title || "Meeting Recording"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ShareRecordingSection
                    recording={recording}
                    onShared={onShared}
                    onClose={onClose}
                    isEmbedded={false}
                />
            </DialogContent>
        </Dialog>
    );
};

export default ShareRecordingModal;

