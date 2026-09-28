import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { Users, Globe, Lock, X, Trash2, Search, Loader2, UserPlus, Check } from "lucide-react";
import { documentKeys } from "../queries/document.keys";
import memberService from "../services/member.service";
import { useUsers } from "@/global/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUserProfile, getAvatarInitials, getAvatarStyle } from "../utils/userProfile";
export { getAvatarInitials, getAvatarStyle, getUserProfile };

export default function ShareModal({ isOpen, onClose, documentId }) {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const [userSearch, setUserSearch] = useState("");
  const [selectedRoles, setSelectedRoles] = useState({}); // userId -> "editor" | "viewer"
  const [error, setError] = useState("");

  // Existing document members and general access
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: documentKeys.members(documentId),
    queryFn: () => memberService.getMembers(documentId),
    enabled: Boolean(documentId) && isOpen,
  });

  const generalAccess = membersData?.generalAccess || "restricted";
  const members = membersData?.members || [];

  // Tenant workspace users (reference from group chats)
  const { data: tenantUsers = [], isLoading: isLoadingUsers } = useUsers({
    search: userSearch,
    status: "active",
    limit: 50,
    enabled: isOpen,
  });

  // Filter out users who are already collaborators
  const availableUsers = (tenantUsers || []).filter((u) => {
    const isAlreadyMember = members.some((m) => (m.userId?._id || m.userId) === u._id);
    return !isAlreadyMember && u._id !== currentUserId;
  });

  const updateGeneralAccessMutation = useMutation({
    mutationFn: (access) => memberService.updateGeneralAccess(documentId, access),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.members(documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload) => memberService.addOrUpdateMember(documentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.members(documentId) });
      setError("");
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err.message || "Failed to invite member");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberUserId) => memberService.removeMember(documentId, memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.members(documentId) });
    },
  });

  if (!isOpen) return null;

  const handleInviteUser = (user) => {
    const role = selectedRoles[user._id] || "editor";
    addMemberMutation.mutate({
      userId: user._id,
      role,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 p-4">
      <div
        className="w-full max-w-lg p-6 bg-card text-card-foreground rounded-xl shadow-2xl border border-border transition-all scale-100 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
            <h3 className="text-base font-heading font-semibold text-foreground">
              Share Document
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-1">
          {error && (
            <div className="p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* General Workspace Access Setting */}
          <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {generalAccess === "restricted" ? (
                <Lock className="size-4 text-muted-foreground" />
              ) : (
                <Globe className="size-4 text-primary" />
              )}
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Workspace Access
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {generalAccess === "restricted"
                    ? "Only invited collaborators can access"
                    : generalAccess === "workspace_view"
                    ? "Anyone in this workspace can view"
                    : "Anyone in this workspace can edit"}
                </p>
              </div>
            </div>

            <select
              value={generalAccess}
              onChange={(e) => updateGeneralAccessMutation.mutate(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-input bg-background text-foreground focus:outline-none cursor-pointer"
            >
              <option value="restricted">Restricted</option>
              <option value="workspace_view">Can view</option>
              <option value="workspace_edit">Can edit</option>
            </select>
          </div>

          {/* Search & Invite Tenant Members */}
          <div className="space-y-2">
            <label className="text-xs font-heading font-semibold text-foreground">
              Invite Team Members
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search team members by name or email..."
                className="pl-8 h-8 text-xs bg-muted/30"
              />
            </div>

            {/* Available Tenant Users List */}
            <div className="border border-border rounded-lg max-h-44 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center p-4 gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Loading team members...</span>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground italic">
                  {userSearch ? "No matching team members found" : "All team members are already collaborators"}
                </div>
              ) : (
                availableUsers.map((u) => {
                  const displayName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || u.email;
                  const currentRole = selectedRoles[u._id] || "editor";

                  return (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <Avatar className="size-7 shrink-0">
                          {u.avatar && <AvatarImage src={u.avatar} />}
                          <AvatarFallback style={getAvatarStyle(u._id)} className="text-[10px] font-bold font-heading">
                            {getAvatarInitials(u)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="truncate min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={currentRole}
                          onChange={(e) =>
                            setSelectedRoles((prev) => ({
                              ...prev,
                              [u._id]: e.target.value,
                            }))
                          }
                          className="text-[11px] px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button
                          type="button"
                          size="xs"
                          onClick={() => handleInviteUser(u)}
                          disabled={addMemberMutation.isPending}
                          className="gap-1 shadow-xs"
                        >
                          <UserPlus className="size-3" />
                          <span>Invite</span>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Current Collaborators on Document */}
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">
              Document Collaborators ({members.length})
            </h4>
            <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin mr-1.5 text-primary" />
                  <span>Loading collaborators...</span>
                </div>
              ) : members.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 italic text-center">
                  No explicit collaborators added
                </p>
              ) : (
              members.map((member) => {
                  const memberId = typeof member.userId === "object" ? member.userId._id : member.userId;
                  const snapshot = member.userSnapshot || {};
                  const populatedUser = typeof member.userId === "object" ? member.userId : null;
                  const matchedTenantUser = tenantUsers.find((u) => u._id === memberId) || (currentUserId === memberId ? user : null);
                  const effectiveUser = populatedUser || matchedTenantUser || snapshot;
                  const profile = getUserProfile(effectiveUser);

                  const displayName = profile.name !== "Collaborator" ? profile.name : (snapshot.name || memberId);
                  const email = profile.email || snapshot.email || "";
                  const avatarUrl = profile.avatar || snapshot.avatar || null;
                  const isOwner = member.role === "owner";

                  return (
                    <div
                      key={member._id || memberId}
                      className="flex items-center justify-between p-2.5 hover:bg-muted/30 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0 flex-1 pr-2">
                        <Avatar className="size-7 shrink-0">
                          {avatarUrl && <AvatarImage src={avatarUrl} />}
                          <AvatarFallback style={profile.avatarStyle} className="text-[10px] font-bold font-heading">
                            {profile.initials}
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

                      <div className="flex items-center gap-2 shrink-0">
                        {isOwner ? (
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            Owner
                          </Badge>
                        ) : (
                          <>
                            <select
                              value={member.role}
                              onChange={(e) =>
                                addMemberMutation.mutate({
                                  userId: memberId,
                                  role: e.target.value,
                                })
                              }
                              className="text-[11px] px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none"
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeMemberMutation.mutate(memberId)}
                              title="Remove collaborator"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 mt-3 border-t border-border shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
