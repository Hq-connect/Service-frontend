import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Hash,
  Lock,
  Pencil,
  Check,
  X,
  UserPlus,
  LogOut,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  Archive,
  ArchiveRestore,
  Trash2,
  Megaphone,
  Globe,
} from "lucide-react";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import {
  useChannelDetails,
  useUpdateChannel,
  useAddChannelMembers,
  useRemoveOrLeaveChannel,
  useUpdateChannelMemberRole,
} from "../../hooks/useChannelActions";
import { useUsers } from "@/global/hooks/useUsers";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { getUserInitials, getAvatarStyle, getUserDisplayName } from "@/global/utils/user";

export default function ChannelDetailsDialog({ open, onOpenChange, chat }) {
  const navigate = useNavigate();
  const chatId = chat?._id || chat?.chatId;
  const { currentUserId } = useCurrentUser();

  const { data: channelDetails } = useChannelDetails(chatId, open);
  const resolvedChannel = channelDetails || chat;

  const { data: members = [], isLoading: isLoadingMembers } = useGroupMembers(
    open ? chatId : null,
    "channel"
  );

  const { mutateAsync: updateChannel, isPending: isUpdating } = useUpdateChannel();
  const { mutateAsync: addMembers, isPending: isAddingMembers } = useAddChannelMembers();
  const { mutateAsync: removeOrLeave, isPending: isLeaving } = useRemoveOrLeaveChannel();
  const { mutateAsync: updateMemberRole } = useUpdateChannelMemberRole();

  const myParticipant = members.find((m) => {
    const mId = String(m.userId?._id || m.userId || m._id || "");
    return mId === String(currentUserId || "");
  });
  const myRole = myParticipant?.role || resolvedChannel?.myRole || "member";
  const isAdminOrOwner = myRole === "owner" || myRole === "admin";

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(resolvedChannel?.name || "");

  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [topicInput, setTopicInput] = useState(resolvedChannel?.topic || "");

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(resolvedChannel?.description || "");

  // Add members state
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    if (resolvedChannel) {
      setNameInput(resolvedChannel.name || "");
      setTopicInput(resolvedChannel.topic || "");
      setDescInput(resolvedChannel.description || "");
    }
  }, [resolvedChannel]);

  const { data: tenantUsers = [], isLoading: isLoadingTenantUsers } = useUsers({
    search: userSearch,
    status: "active",
    limit: 50,
    enabled: open && showAddMembers,
  });

  const memberUserIds = new Set(
    (members ?? []).map((m) => String(m.userId?._id || m.userId || m._id || ""))
  );
  const availableUsers = tenantUsers.filter(
    (u) => !memberUserIds.has(String(u._id)) && String(u._id) !== String(currentUserId)
  );

  const handleSaveField = async (fields, onDone) => {
    try {
      await updateChannel({ chatId, ...fields });
      onDone?.();
    } catch (err) {
      console.error("Failed to update channel:", err);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await addMembers({ chatId, userIds: selectedUserIds });
      setSelectedUserIds([]);
      setShowAddMembers(false);
    } catch (err) {
      console.error("Failed to add channel members:", err);
    }
  };

  const handleLeaveChannel = async () => {
    if (window.confirm("Are you sure you want to leave this channel?")) {
      try {
        await removeOrLeave({ chatId });
        onOpenChange(false);
        navigate("/chats/channel");
      } catch (err) {
        console.error("Failed to leave channel:", err);
      }
    }
  };

  const handleKickMember = async (targetUserId, displayName) => {
    if (window.confirm(`Remove ${displayName} from this channel?`)) {
      try {
        await removeOrLeave({ chatId, userId: targetUserId });
      } catch (err) {
        console.error("Failed to remove member:", err);
      }
    }
  };

  const handleToggleRole = async (targetUserId, currentRole) => {
    const nextRole = currentRole === "admin" ? "member" : "admin";
    try {
      await updateMemberRole({ chatId, userId: targetUserId, role: nextRole });
    } catch (err) {
      console.error("Failed to update member role:", err);
    }
  };

  if (!resolvedChannel) return null;

  const canAddMembers =
    !resolvedChannel.isArchived &&
    (resolvedChannel.visibility === "public" || isAdminOrOwner);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <div className="flex items-start gap-3 pr-6">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              {resolvedChannel.visibility === "private" ? (
                <Lock className="size-5" />
              ) : (
                <Hash className="size-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name */}
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="size-8 shrink-0"
                    disabled={isUpdating || !nameInput.trim()}
                    onClick={() =>
                      handleSaveField({ name: nameInput.trim() }, () => setIsEditingName(false))
                    }
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    onClick={() => {
                      setNameInput(resolvedChannel.name || "");
                      setIsEditingName(false);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold truncate">
                    #{resolvedChannel.name || "channel"}
                  </DialogTitle>
                  {resolvedChannel.isArchived && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Archived
                    </span>
                  )}
                  {isAdminOrOwner && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Topic */}
              {isEditingTopic ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Input
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Channel topic..."
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="size-7 shrink-0"
                    disabled={isUpdating}
                    onClick={() =>
                      handleSaveField({ topic: topicInput.trim() || null }, () =>
                        setIsEditingTopic(false)
                      )
                    }
                  >
                    <Check className="size-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => {
                      setTopicInput(resolvedChannel.topic || "");
                      setIsEditingTopic(false);
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <DialogDescription className="text-xs text-muted-foreground truncate">
                    <span className="font-medium text-foreground/80">Topic:</span>{" "}
                    {resolvedChannel.topic || "No topic set"}
                  </DialogDescription>
                  {isAdminOrOwner && (
                    <button
                      onClick={() => setIsEditingTopic(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
          {/* Description */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              {isAdminOrOwner && !isEditingDesc && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3" />
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <div className="flex items-center gap-1.5 pt-1">
                <Input
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Describe this channel..."
                  className="h-7 text-xs bg-background"
                  autoFocus
                />
                <Button
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={isUpdating}
                  onClick={() =>
                    handleSaveField({ description: descInput.trim() || null }, () =>
                      setIsEditingDesc(false)
                    )
                  }
                >
                  <Check className="size-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0"
                  onClick={() => {
                    setDescInput(resolvedChannel.description || "");
                    setIsEditingDesc(false);
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-foreground/90">
                {resolvedChannel.description || "No description provided."}
              </p>
            )}
          </div>

          {/* Admin Settings Controls */}
          {isAdminOrOwner && (
            <div className="p-3 rounded-lg border border-border bg-card space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Channel Settings & Permissions
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  disabled={isUpdating}
                  onClick={() =>
                    handleSaveField({
                      visibility:
                        resolvedChannel.visibility === "private" ? "public" : "private",
                    })
                  }
                >
                  {resolvedChannel.visibility === "private" ? (
                    <>
                      <Lock className="size-3.5 text-amber-500" />
                      Private (Switch to Public)
                    </>
                  ) : (
                    <>
                      <Globe className="size-3.5 text-emerald-500" />
                      Public (Switch to Private)
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  disabled={isUpdating}
                  onClick={() =>
                    handleSaveField({
                      postingPermission:
                        resolvedChannel.postingPermission === "admins_only"
                          ? "everyone"
                          : "admins_only",
                    })
                  }
                >
                  <Megaphone className="size-3.5 text-primary" />
                  {resolvedChannel.postingPermission === "admins_only"
                    ? "Admins Only (Switch to Everyone)"
                    : "Everyone Posts (Switch to Admins Only)"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  disabled={isUpdating}
                  onClick={() =>
                    handleSaveField({
                      isArchived: !resolvedChannel.isArchived,
                    })
                  }
                >
                  {resolvedChannel.isArchived ? (
                    <>
                      <ArchiveRestore className="size-3.5 text-emerald-500" />
                      Unarchive Channel
                    </>
                  ) : (
                    <>
                      <Archive className="size-3.5 text-amber-500" />
                      Archive Channel
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Members Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Members ({members.length})
            </h4>
            {canAddMembers && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowAddMembers(!showAddMembers)}
              >
                <UserPlus className="size-3.5" />
                {showAddMembers ? "Cancel" : "Add Members"}
              </Button>
            )}
          </div>

          {/* Add Members Panel */}
          {showAddMembers && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search workspace members..."
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              <div className="max-h-36 overflow-y-auto border border-border rounded-md divide-y divide-border/40 bg-background">
                {isLoadingTenantUsers ? (
                  <div className="p-3 text-center">
                    <Loader2 className="size-4 animate-spin text-muted-foreground inline-block" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="p-2.5 text-center text-xs text-muted-foreground">
                    No available members to add
                  </div>
                ) : (
                  availableUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u._id);
                    const displayName = getUserDisplayName(u);
                    return (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() =>
                          setSelectedUserIds((prev) =>
                            prev.includes(u._id)
                              ? prev.filter((id) => id !== u._id)
                              : [...prev, u._id]
                          )
                        }
                        className={`w-full flex items-center justify-between p-2 text-left hover:bg-accent/50 transition-colors text-xs ${
                          isSelected ? "bg-accent/30" : ""
                        }`}
                      >
                        <span className="font-medium text-foreground truncate">{displayName}</span>
                        <div
                          className={`size-4 rounded border flex items-center justify-center ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <Check className="size-3" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedUserIds.length > 0 && (
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleAddMembersSubmit}
                    disabled={isAddingMembers}
                  >
                    {isAddingMembers && <Loader2 className="size-3 animate-spin mr-1" />}
                    Add ({selectedUserIds.length}) Selected
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-1 divide-y divide-border/40 border border-border rounded-lg overflow-hidden">
            {isLoadingMembers ? (
              <div className="p-4 text-center">
                <Loader2 className="size-4 animate-spin text-muted-foreground inline-block" />
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No members found
              </div>
            ) : (
              members.map((member) => {
                const memberUserId = String(member.userId?._id || member.userId || member._id || "");
                const displayName = getUserDisplayName(member);
                const avatarUrl = member.userSnapshot?.avatar || member.avatar;
                const initials = getUserInitials(member);
                const avatarStyle = getAvatarStyle(member);
                const isSelf = memberUserId === String(currentUserId || "");
                const role = member.role || "member";

                return (
                  <div
                    key={member._id || memberUserId}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8">
                        {avatarUrl && <AvatarImage src={avatarUrl} />}
                        <AvatarFallback style={avatarStyle} className="text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-foreground truncate">
                            {displayName}{" "}
                            {isSelf && (
                              <span className="text-[10px] text-muted-foreground font-normal">
                                (You)
                              </span>
                            )}
                          </p>
                          {role === "owner" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-primary/15 text-primary">
                              Owner
                            </span>
                          )}
                          {role === "admin" && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate capitalize">
                          {role}
                        </p>
                      </div>
                    </div>

                    {/* Admin role toggle & remove buttons */}
                    {isAdminOrOwner && !isSelf && role !== "owner" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title={role === "admin" ? "Demote to Member" : "Promote to Admin"}
                          onClick={() => handleToggleRole(memberUserId, role)}
                          className="h-7 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {role === "admin" ? (
                            <>
                              <ShieldAlert className="size-3" />
                              Demote
                            </>
                          ) : (
                            <>
                              <Shield className="size-3" />
                              Make Admin
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Remove from channel"
                          onClick={() => handleKickMember(memberUserId, displayName)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Leave Channel */}
          {myParticipant && (
            <div className="pt-3 pb-1 border-t border-border flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleLeaveChannel}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <LogOut className="size-3.5" />
                )}
                Leave Channel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

