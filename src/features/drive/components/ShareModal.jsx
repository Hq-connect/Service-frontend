import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Share2,
  Users,
  Search,
  Loader2,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Link2,
  Globe,
  Folder,
  File,
} from "lucide-react";
import { useUsers } from "@/global/hooks/useUsers";
import {
  getAvatarInitials,
  getAvatarStyle,
  getUserProfile,
} from "@/global/utils/user";
import {
  useShares,
  useGrantUserAccess,
  useCreateShareLink,
  useRevokeShare,
} from "../queries/drive.queries";
import { toast } from "sonner";

export default function ShareModal({
  isOpen,
  onClose,
  targetType = "file", // 'file' | 'folder'
  targetItem, // File or Folder object
}) {
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const targetId = targetItem?._id;
  const targetName = targetItem?.name || "Item";

  // State
  const [userSearch, setUserSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("Viewer"); // Default role to invite
  const [copiedLink, setCopiedLink] = useState(false);
  const [linkRole, setLinkRole] = useState("Viewer");

  // React Queries
  const { data: shares = [], isLoading: isLoadingShares } = useShares(targetId);

  const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
    search: userSearch,
    status: "active",
    limit: 30,
    enabled: isOpen,
  });

  // Mutations
  const grantAccessMutation = useGrantUserAccess();
  const createLinkMutation = useCreateShareLink();
  const revokeShareMutation = useRevokeShare();

  // Find user-based shares
  const userShares = shares.filter((s) => s.subjectUserId);
  const linkShares = shares.filter((s) => s.tokenHash || !s.subjectUserId);

  // Filter out users who already have explicit access or are the current user / owner
  const availableUsers = (tenantUsers || []).filter((u) => {
    const isOwner = String(targetItem?.ownerId) === String(u._id);
    const hasAccess = userShares.some((s) => String(s.subjectUserId) === String(u._id));
    return !isOwner && !hasAccess && String(u._id) !== String(currentUserId);
  });

  // Invite user handler
  const handleInviteUser = (user) => {
    if (!targetId) return;
    grantAccessMutation.mutate(
      {
        targetType,
        targetId,
        subjectUserId: user._id,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          setUserSearch("");
        },
      }
    );
  };

  // Change existing user's role
  const handleChangeRole = (share, newRole) => {
    grantAccessMutation.mutate({
      targetType,
      targetId,
      subjectUserId: share.subjectUserId,
      role: newRole,
    });
  };

  // Revoke user or link share
  const handleRevoke = (shareId) => {
    revokeShareMutation.mutate({ shareId, targetId });
  };

  // Create or copy shareable link
  const handleCopyLink = () => {
    createLinkMutation.mutate(
      {
        targetType,
        targetId,
        role: linkRole,
        expiresInDays: 7,
      },
      {
        onSuccess: (res) => {
          const token = res.token;
          const shareUrl = `${window.location.origin}/files?shareToken=${token}&type=${targetType}&id=${targetId}`;
          navigator.clipboard.writeText(shareUrl);
          setCopiedLink(true);
          toast.success("Share link copied to clipboard");
          setTimeout(() => setCopiedLink(false), 2500);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              {targetType === "folder" ? (
                <Folder className="size-4" />
              ) : (
                <File className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm font-semibold truncate text-foreground">
                Share "{targetName}"
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                {targetType} Sharing & Permissions
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Add People */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <UserPlus className="size-3.5 text-muted-foreground" />
              <span>Invite Teammates</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search teammates by name or email..."
                  className="pl-8 h-8 text-xs bg-card"
                />
              </div>

              {/* Default Role Picker for invitation */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-8 text-xs px-2.5 rounded-md border border-input bg-card text-foreground focus:outline-none cursor-pointer"
              >
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
              </select>
            </div>

            {/* Teammate Search Results Dropdown / List */}
            {userSearch && (
              <div className="border border-border rounded-lg max-h-40 overflow-y-auto divide-y divide-border/60 bg-muted/20 custom-scrollbar">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>Searching teammates...</span>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground text-center italic">
                    No teammates found
                  </p>
                ) : (
                  availableUsers.map((u) => {
                    const profile = getUserProfile(u);
                    const displayName =
                      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                      u.name ||
                      u.email;

                    return (
                      <div
                        key={u._id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Avatar className="size-6 shrink-0">
                            {u.avatar && <AvatarImage src={u.avatar} />}
                            <AvatarFallback
                              style={getAvatarStyle(u._id)}
                              className="text-[9px] font-bold"
                            >
                              {getAvatarInitials(u)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="truncate min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="xs"
                          onClick={() => handleInviteUser(u)}
                          disabled={grantAccessMutation.isPending}
                          className="h-7 text-xs gap-1 cursor-pointer shrink-0"
                        >
                          <UserPlus className="size-3" />
                          <span>Add</span>
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Section 2: People with Access */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>People with access</span>
              <span className="text-[11px] font-mono lowercase">
                {userShares.length + 1} member{userShares.length > 0 ? "s" : ""}
              </span>
            </h4>

            <div className="space-y-2 divide-y divide-border/40">
              {/* Owner row */}
              <div className="flex items-center justify-between py-2 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="size-7 shrink-0">
                    {currentUser?.avatar && <AvatarImage src={currentUser.avatar} />}
                    <AvatarFallback
                      style={getAvatarStyle(currentUserId)}
                      className="text-[10px] font-bold"
                    >
                      {getAvatarInitials(currentUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {currentUser?.firstName
                        ? `${currentUser.firstName} ${currentUser.lastName || ""}`
                        : "You (Owner)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {currentUser?.email || "Workspace Administrator"}
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="text-[10px] shrink-0 font-medium">
                  Owner
                </Badge>
              </div>

              {/* Shared Collaborators */}
              {isLoadingShares ? (
                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Loading collaborators...</span>
                </div>
              ) : (
                userShares.map((share) => {
                  const matchedUser = tenantUsers.find(
                    (u) => String(u._id) === String(share.subjectUserId)
                  );
                  const displayName = matchedUser
                    ? `${matchedUser.firstName || ""} ${matchedUser.lastName || ""}`.trim() ||
                      matchedUser.email
                    : `User ${share.subjectUserId.substring(0, 8)}...`;
                  const email = matchedUser?.email || "";

                  return (
                    <div
                      key={share._id}
                      className="flex items-center justify-between py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Avatar className="size-7 shrink-0">
                          {matchedUser?.avatar && (
                            <AvatarImage src={matchedUser.avatar} />
                          )}
                          <AvatarFallback
                            style={getAvatarStyle(share.subjectUserId)}
                            className="text-[10px] font-bold"
                          >
                            {matchedUser ? getAvatarInitials(matchedUser) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {displayName}
                          </p>
                          {email && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Change Role Selector */}
                        <select
                          value={share.role}
                          onChange={(e) => handleChangeRole(share, e.target.value)}
                          className="h-7 text-[11px] px-2 rounded-md border border-input bg-card text-foreground focus:outline-none cursor-pointer"
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Editor">Editor</option>
                        </select>

                        {/* Remove access button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRevoke(share._id)}
                          title="Remove access"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: General Access / Link Sharing */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Globe className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    General Link Access
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Anyone with the share link can access
                  </p>
                </div>
              </div>

              {/* Link Role Selector */}
              <select
                value={linkRole}
                onChange={(e) => setLinkRole(e.target.value)}
                className="h-7 text-[11px] px-2 rounded-md border border-input bg-card text-foreground focus:outline-none cursor-pointer"
              >
                <option value="Viewer">Viewer</option>
                <option value="Editor">Editor</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground font-mono">
                {linkShares.length > 0
                  ? `${linkShares.length} active share link(s)`
                  : "No link created yet"}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                disabled={createLinkMutation.isPending}
                className="h-7 text-xs gap-1.5 font-medium cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="size-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      Copied!
                    </span>
                  </>
                ) : (
                  <>
                    <Link2 className="size-3" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 px-5 border-t border-border bg-card flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="text-xs h-8 px-4 cursor-pointer"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

