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
import {
  Check,
  Search,
  Hash,
  Lock,
  Globe,
  Megaphone,
  MessageSquare,
  X,
  Loader2,
} from "lucide-react";
import { useUsers } from "@/global/hooks/useUsers";
import useCurrentUser from "@/features/auth/hooks/useCurrentUser";
import { useCreateChannel } from "../../hooks/useChannelActions";
import { getUserInitials, getAvatarStyle, getUserDisplayName } from "@/global/utils/user";

export default function CreateChannelDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { currentUserId } = useCurrentUser();

  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [postingPermission, setPostingPermission] = useState("everyone");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const { mutateAsync: createChannel, isPending } = useCreateChannel();

  const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
    search: userSearch,
    status: "active",
    limit: 50,
    enabled: open,
  });

  const availableUsers = tenantUsers.filter((u) => u._id !== currentUserId);

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleRemoveSelected = (userId) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const selectedUsers = availableUsers.filter((u) => selectedUserIds.includes(u._id));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newChannel = await createChannel({
        name: name.trim().replace(/^#/, ""),
        topic: topic.trim() || null,
        description: description.trim() || null,
        visibility,
        postingPermission,
        userIds: selectedUserIds,
      });

      setName("");
      setTopic("");
      setDescription("");
      setVisibility("public");
      setPostingPermission("everyone");
      setSelectedUserIds([]);
      setUserSearch("");
      onOpenChange(false);

      if (newChannel?._id || newChannel?.chatId) {
        navigate(`/chats/channel/${newChannel._id || newChannel.chatId}`);
      }
    } catch (err) {
      console.error("Failed to create channel:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2.5 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            {visibility === "private" ? (
              <Lock className="size-4 text-primary" />
            ) : (
              <Hash className="size-4 text-primary" />
            )}
            Create a Channel
          </DialogTitle>
          <DialogDescription className="text-xs">
            Channels are organized spaces for topics, teams, or announcements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 pb-5 space-y-4">
            {/* Channel Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Channel Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                {visibility === "private" ? (
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                ) : (
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                )}
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. engineering, announcements, product-updates"
                  className="pl-8 h-9 text-sm"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Topic <span className="text-muted-foreground font-normal">(optional, shown in header)</span>
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Sprint updates & release coordination"
                className="h-9 text-sm"
                maxLength={250}
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
                placeholder="What is this channel used for?"
                className="h-9 text-sm"
                maxLength={500}
              />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                    visibility === "public"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Globe className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Public</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                      Anyone in workspace can find and join
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("private")}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                    visibility === "private"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Lock className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Private</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                      Only invited members can view & join
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Posting Permission */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Who can post messages?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPostingPermission("everyone")}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                    postingPermission === "everyone"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <MessageSquare className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Everyone</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                      All channel members can post
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPostingPermission("admins_only")}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                    postingPermission === "admins_only"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Megaphone className="size-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Admins Only</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                      Announcement mode (admins post)
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Selected users chips */}
            {selectedUserIds.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Initial Members ({selectedUserIds.length})
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-muted/40 rounded-lg border border-border">
                  {selectedUsers.map((u) => {
                    const displayName = getUserDisplayName(u);
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
                Add Initial Members <span className="text-muted-foreground font-normal">(optional)</span>
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

              <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border/40">
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
                    const displayName = getUserDisplayName(u);
                    const initials = getUserInitials(u);
                    const avatarStyle = getAvatarStyle(u);

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
                              style={avatarStyle}
                              className="text-[10px] font-semibold"
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{displayName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
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

          <DialogFooter className="p-4 border-t border-border bg-muted/20 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim() || isPending}>
              {isPending && <Loader2 className="size-3 animate-spin mr-1" />}
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

