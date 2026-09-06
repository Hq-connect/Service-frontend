import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Search, Users, X, Loader2 } from "lucide-react";
import { useUsers } from "@/global/hooks/useUsers";
import useAuth from "@/features/auth/hooks/useAuth";
import { useCreateGroup } from "../../hooks/useCreateGroup";

export default function CreateGroupDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user?.user || user?.data || user;
  const currentUserId = currentUser?._id || currentUser?.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const { mutateAsync: createGroup, isPending } = useCreateGroup();

  const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
    search: userSearch,
    status: "active",
    limit: 50,
  });

  const availableUsers = tenantUsers.filter(
    (u) => u._id !== currentUserId
  );

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemoveSelected = (userId) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const selectedUsers = availableUsers.filter((u) =>
    selectedUserIds.includes(u._id)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newGroup = await createGroup({
        name: name.trim(),
        description: description.trim(),
        members: selectedUserIds,
      });

      // Reset state and close
      setName("");
      setDescription("");
      setSelectedUserIds([]);
      setUserSearch("");
      onOpenChange(false);

      if (newGroup?._id || newGroup?.chatId) {
        navigate(`/chats/group/${newGroup._id || newGroup.chatId}`);
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            Create Group Chat
          </DialogTitle>
          <DialogDescription className="text-xs">
            Start a new discussion group with team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 pb-5 space-y-4">
            {/* Group Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Group Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Project Launch, Design Team"
                className="h-9 text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                className="h-9 text-sm"
              />
            </div>

            {/* Selected users chips */}
            {selectedUserIds.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Selected Members ({selectedUserIds.length})
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-muted/40 rounded-lg border border-border">
                  {selectedUsers.map((u) => {
                    const displayName =
                      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                      u.name ||
                      u.email;
                    return (
                      <span
                        key={u._id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        <span className="truncate max-w-[120px]">{displayName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelected(u._id)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Member selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Add Members
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search team members..."
                  className="pl-8 h-8 text-xs bg-muted/50"
                />
              </div>

              <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border/40">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No members found
                  </div>
                ) : (
                  availableUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u._id);
                    const displayName =
                      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                      u.name ||
                      u.email;
                    const initials = displayName
                      .split(" ")
                      .map((w) => w[0] ?? "")
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "U";

                    let hash = 0;
                    const seed = u._id ?? u.email ?? "u";
                    for (let i = 0; i < seed.length; i++)
                      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
                    const h = Math.abs(hash % 360);

                    return (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => toggleUserSelection(u._id)}
                        className={`w-full flex items-center justify-between p-2 text-left hover:bg-accent/50 transition-colors text-xs ${
                          isSelected ? "bg-accent/30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-7">
                            {u.avatar && <AvatarImage src={u.avatar} />}
                            <AvatarFallback
                              style={{
                                backgroundColor: `hsl(${h},55%,88%)`,
                                color: `hsl(${h},60%,30%)`,
                              }}
                              className="text-[10px] font-semibold"
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`size-4 rounded border flex items-center justify-center transition-colors ${
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
            </div>
          </div>

          <DialogFooter className="p-6 border-t border-border bg-muted/20 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || isPending}
            >
              {isPending && <Loader2 className="size-3 animate-spin mr-1" />}
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
