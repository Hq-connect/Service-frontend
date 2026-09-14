import React, { useState } from "react";
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
  Users,
  Pencil,
  Check,
  X,
  UserPlus,
  LogOut,
  Loader2,
  Search,
} from "lucide-react";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { useUpdateGroupName } from "../../hooks/useUpdateGroupName";
import { useUpdateGroupDescription } from "../../hooks/useUpdateGroupDescription";
import { useAddGroupMembers } from "../../hooks/useAddGroupMembers";
import { useLeaveGroup } from "../../hooks/useLeaveGroup";
import { useUsers } from "@/global/hooks/useUsers";
import useAuth from "@/features/auth/hooks/useAuth";

export default function GroupDetailsDialog({ open, onOpenChange, chat }) {
  const navigate = useNavigate();
  const chatId = chat?._id || chat?.chatId;

  const { user } = useAuth();
  const currentUser = user?.user || user?.data || user;
  const currentUserId = currentUser?._id || currentUser?.id;

  const { data: members = [], isLoading: isLoadingMembers } = useGroupMembers(chatId);
  const { mutateAsync: updateName, isPending: isUpdatingName } = useUpdateGroupName();
  const { mutateAsync: updateDesc, isPending: isUpdatingDesc } = useUpdateGroupDescription();
  const { mutateAsync: addMembers, isPending: isAddingMembers } = useAddGroupMembers();
  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup();

  // Name edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(chat?.name || "");

  // Description edit state
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState(chat?.description || "");

  // Add member state
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Sync state when chat prop updates
  React.useEffect(() => {
    if (chat?.name) setNameInput(chat.name);
    if (chat?.description) setDescInput(chat.description);
  }, [chat]);

  const { data: tenantUsers = [], isLoading: isLoadingTenantUsers } = useUsers({
    search: userSearch,
    status: "active",
    limit: 50,
  });

  const memberUserIds = new Set((members ?? []).map((m) => m.userId || m._id || m.id || m.userSnapshot?._id));
  const availableUsers = tenantUsers.filter(
    (u) => !memberUserIds.has(u._id) && u._id !== currentUserId
  );

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput === chat?.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateName({ chatId, name: nameInput.trim() });
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update group name:", err);
    }
  };

  const handleSaveDesc = async () => {
    if (descInput === chat?.description) {
      setIsEditingDesc(false);
      return;
    }
    try {
      await updateDesc({ chatId, description: descInput.trim() });
      setIsEditingDesc(false);
    } catch (err) {
      console.error("Failed to update group description:", err);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await addMembers({ chatId, userIds: selectedUserIds });
      setSelectedUserIds([]);
      setShowAddMembers(false);
    } catch (err) {
      console.error("Failed to add group members:", err);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      try {
        await leaveGroup(chatId);
        onOpenChange(false);
        navigate("/chats/group");
      } catch (err) {
        console.error("Failed to leave group:", err);
      }
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  if (!chat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
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
                    onClick={handleSaveName}
                    disabled={isUpdatingName}
                  >
                    {isUpdatingName ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    onClick={() => {
                      setNameInput(chat.name || "");
                      setIsEditingName(false);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold truncate">
                    {chat.name || "Group Details"}
                  </DialogTitle>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              )}

              {/* Group Description */}
              {isEditingDesc ? (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Input
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Group description..."
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={handleSaveDesc}
                    disabled={isUpdatingDesc}
                  >
                    {isUpdatingDesc ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => {
                      setDescInput(chat.description || "");
                      setIsEditingDesc(false);
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <DialogDescription className="text-xs text-muted-foreground truncate">
                    {chat.description || "No description set."}
                  </DialogDescription>
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="size-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Members ({members.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowAddMembers(!showAddMembers)}
            >
              <UserPlus className="size-3.5" />
              {showAddMembers ? "Cancel Add" : "Add Members"}
            </Button>
          </div>

          {/* Add Members Panel */}
          {showAddMembers && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
              <p className="text-xs font-medium text-foreground">Add new members to group</p>
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
                    const displayName =
                      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.name || u.email;
                    return (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => toggleUserSelection(u._id)}
                        className={`w-full flex items-center justify-between p-2 text-left hover:bg-accent/50 transition-colors text-xs ${
                          isSelected ? "bg-accent/30" : ""
                        }`}
                      >
                        <span className="font-medium text-foreground truncate">{displayName}</span>
                        <div
                          className={`size-4 rounded border flex items-center justify-center ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
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
                <div className="flex justify-end gap-2 pt-1">
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
                No member list available
              </div>
            ) : (
              members.map((member) => {
                const memberUserId = member.userId || member._id || member.id;
                const displayName =
                  member.userSnapshot?.name ||
                  `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() ||
                  member.name ||
                  member.email ||
                  "Member";
                const avatarUrl = member.userSnapshot?.avatar || member.avatar;
                const initials = displayName
                  .split(" ")
                  .map((w) => w[0] ?? "")
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "M";

                let hash = 0;
                const seed = memberUserId ?? member.email ?? "m";
                for (let i = 0; i < seed.length; i++)
                  hash = seed.charCodeAt(i) + ((hash << 5) - hash);
                const h = Math.abs(hash % 360);

                const isSelf = memberUserId === currentUserId || member._id === currentUserId;

                return (
                  <div
                    key={member._id || memberUserId}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8">
                        {avatarUrl && <AvatarImage src={avatarUrl} />}
                        <AvatarFallback
                          style={{
                            backgroundColor: `hsl(${h},55%,88%)`,
                            color: `hsl(${h},60%,30%)`,
                          }}
                          className="text-xs font-semibold"
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {displayName} {isSelf && <span className="text-[10px] text-muted-foreground font-normal">(You)</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate capitalize">
                          {member.email || member.role || "Member"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Leave Group Button */}
          <div className="pt-3 pb-1 border-t border-border flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleLeaveGroup}
              disabled={isLeaving}
            >
              {isLeaving ? <Loader2 className="size-3 animate-spin" /> : <LogOut className="size-3.5" />}
              Leave Group
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
