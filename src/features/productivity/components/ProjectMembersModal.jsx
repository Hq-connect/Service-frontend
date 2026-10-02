import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from '../queries/project.queries';
import { useUsers } from '@/global/hooks/useUsers';
import { X, UserPlus, Trash2, Shield, Loader2, Check, AlertCircle, Search, ChevronDown, User } from 'lucide-react';
import { getInitials, getAvatarStyle } from '@/global/utils/user';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const ProjectMembersModal = ({ isOpen, onClose, projectId, projectName }) => {
    const { data: membersResponse, isLoading: isLoadingMembers } = useProjectMembers(projectId);
    const { data: tenantUsers, isLoading: isLoadingUsers } = useUsers({ 
        status: 'active', 
        limit: 100, 
        enabled: isOpen 
    });

    const addMemberMutation = useAddProjectMember();
    const removeMemberMutation = useRemoveProjectMember();

    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
    const [userSearch, setUserSearch] = useState('');
    const [customUserId, setCustomUserId] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    if (!isOpen) return null;

    const currentMembers = membersResponse?.data?.members || [];
    const memberUserIds = new Set(
        currentMembers.map((m) => (m.userId?._id ? String(m.userId._id) : String(m.userId)))
    );

    // Normalize tenantUsers if wrapped
    const allUsers = Array.isArray(tenantUsers) ? tenantUsers : (tenantUsers?.users || []);
    // Filter tenant users who are active/approved by admin and not yet added to this project
    const availableUsers = allUsers.filter((u) => {
        const isApproved = u.status === 'active';
        return isApproved && !memberUserIds.has(String(u._id));
    });
    
    const filteredUsers = availableUsers.filter((u) => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || '';
        const email = u.email || '';
        const q = userSearch.toLowerCase();
        return fullName.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });

    const selectedUserObj = availableUsers.find((u) => String(u._id) === String(selectedUserId));

    const handleAddMember = (e) => {
        e?.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const targetUserId = useManualInput ? customUserId.trim() : selectedUserId;
        if (!targetUserId) {
            setErrorMessage('Please select a member to add');
            return;
        }

        addMemberMutation.mutate(
            {
                projectId,
                data: {
                    userId: targetUserId,
                    role: selectedRole,
                },
            },
            {
                onSuccess: () => {
                    setSelectedUserId('');
                    setCustomUserId('');
                    setUserSearch('');
                    setSuccessMessage('Member added successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
                onError: (err) => {
                    const msg = err.response?.data?.message || err.message || 'Failed to add member';
                    setErrorMessage(msg);
                },
            }
        );
    };

    const handleRemoveMember = (userId) => {
        if (!window.confirm('Are you sure you want to remove this member from the project?')) return;
        setErrorMessage('');
        setSuccessMessage('');

        removeMemberMutation.mutate(
            { projectId, userId },
            {
                onSuccess: () => {
                    setSuccessMessage('Member removed successfully');
                    setTimeout(() => setSuccessMessage(''), 3000);
                },
                onError: (err) => {
                    const msg = err.response?.data?.message || err.message || 'Failed to remove member';
                    setErrorMessage(msg);
                },
            }
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in-0 duration-150">
            <div className="bg-card text-card-foreground rounded-lg border border-border shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-border shrink-0 bg-muted/20">
                    <div className="min-w-0 pr-2">
                        <h2 className="text-base sm:text-lg font-semibold tracking-tight truncate text-foreground">
                            Project Members
                        </h2>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {projectName ? `Project: ${projectName}` : 'Manage project access & roles'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors shrink-0"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Alerts */}
                    {errorMessage && (
                        <div className="flex items-center gap-2 p-2.5 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20 animate-in fade-in-50">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="flex-1 font-medium">{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-md border border-emerald-200 animate-in fade-in-50">
                            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span className="flex-1 font-medium">{successMessage}</span>
                        </div>
                    )}

                    {/* Add Member Section */}
                    <div className="space-y-3 p-3.5 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5 text-primary" />
                                Add Team Member
                            </label>
                            <button
                                type="button"
                                onClick={() => setUseManualInput(!useManualInput)}
                                className="text-[11px] text-primary hover:underline font-medium"
                            >
                                {useManualInput ? 'Choose from list' : 'Enter User ID directly'}
                            </button>
                        </div>

                        {useManualInput ? (
                            <form onSubmit={handleAddMember} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter 24-character User ID..."
                                    value={customUserId}
                                    onChange={(e) => setCustomUserId(e.target.value)}
                                    className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring shadow-2xs"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium flex items-center gap-1.5 capitalize hover:bg-muted transition-colors cursor-pointer shrink-0">
                                        <span>Role: {selectedRole}</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 p-1 text-xs">
                                        {['member', 'admin', 'viewer'].map((role) => (
                                            <DropdownMenuItem
                                                key={role}
                                                onClick={() => setSelectedRole(role)}
                                                className="capitalize flex items-center justify-between cursor-pointer"
                                            >
                                                <span>{role}</span>
                                                {selectedRole === role && <Check className="w-3.5 h-3.5 text-primary" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <button
                                    type="submit"
                                    disabled={!customUserId.trim() || addMemberMutation.isPending}
                                    className="h-8 px-3 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shrink-0 transition-opacity shadow-2xs"
                                >
                                    {addMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Add</span>}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-2">
                                {/* Search input */}
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Search team members by name or email..."
                                        className="w-full h-8 pl-8 pr-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring shadow-2xs placeholder:text-muted-foreground"
                                    />
                                </div>

                                {/* Available Users List (Reference from CreateGroupDialog) */}
                                <div className="border border-border rounded-lg max-h-44 overflow-y-auto divide-y divide-border/40 bg-card">
                                    {isLoadingUsers ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : availableUsers.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-muted-foreground">
                                            All organization members are already added to this project.
                                        </div>
                                    ) : filteredUsers.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-muted-foreground">
                                            No team members found matching "{userSearch}"
                                        </div>
                                    ) : (
                                        filteredUsers.map((u) => {
                                            const isSelected = String(selectedUserId) === String(u._id);
                                            const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email;
                                            const initials = getInitials(displayName);
                                            const avatarStyle = getAvatarStyle(u._id || u.email);

                                            return (
                                                <button
                                                    key={u._id}
                                                    type="button"
                                                    onClick={() => setSelectedUserId(isSelected ? '' : u._id)}
                                                    className={`w-full flex items-center justify-between p-2 text-left hover:bg-accent/50 transition-colors text-xs cursor-pointer ${
                                                        isSelected ? 'bg-primary/10' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {u.avatar ? (
                                                            <img
                                                                src={u.avatar}
                                                                alt={displayName}
                                                                className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                                                            />
                                                        ) : (
                                                            <div
                                                                style={avatarStyle}
                                                                className="w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 border border-border/40 shadow-2xs"
                                                            >
                                                                {initials}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-foreground truncate leading-tight">
                                                                {displayName}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground truncate">
                                                                {u.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                                                            isSelected
                                                                ? 'bg-primary border-primary text-primary-foreground'
                                                                : 'border-muted-foreground/40'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="w-2.5 h-2.5" />}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Controls: Role Dropdown & Add Button */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-muted-foreground">Assign Role:</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="h-7 px-2.5 rounded-md border border-input bg-card text-xs font-semibold flex items-center gap-1.5 capitalize hover:bg-muted transition-colors cursor-pointer shadow-2xs">
                                                <span>{selectedRole}</span>
                                                <ChevronDown className="w-3 h-3 opacity-60" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-36 p-1 text-xs">
                                                <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                                                    Select Role
                                                </DropdownMenuLabel>
                                                {['member', 'admin', 'viewer'].map((role) => (
                                                    <DropdownMenuItem
                                                        key={role}
                                                        onClick={() => setSelectedRole(role)}
                                                        className="capitalize flex items-center justify-between cursor-pointer py-1.5"
                                                    >
                                                        <span>{role}</span>
                                                        {selectedRole === role && <Check className="w-3.5 h-3.5 text-primary" />}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddMember}
                                        disabled={!selectedUserId || addMemberMutation.isPending}
                                        className="h-8 px-3.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-opacity shadow-2xs"
                                    >
                                        {addMemberMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-3.5 h-3.5" />
                                                <span>Add to Project</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Member List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Current Members ({currentMembers.length})
                            </span>
                        </div>

                        {isLoadingMembers ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : currentMembers.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 rounded-lg border border-dashed border-border">
                                No members found in this project.
                            </div>
                        ) : (
                            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                {currentMembers.map((m) => {
                                    const memberName = m.userSnapshot?.name || 'Member';
                                    const memberAvatar = m.userSnapshot?.avatar;
                                    const memberUserId = m.userId?._id ? String(m.userId._id) : String(m.userId);
                                    const isOwner = m.role === 'owner';
                                    const initials = getInitials(memberName);
                                    const avatarStyle = getAvatarStyle(memberUserId || memberName);

                                    return (
                                        <div
                                            key={m._id || memberUserId}
                                            className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border/80 hover:border-border transition-colors gap-3"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {memberAvatar ? (
                                                    <img
                                                        src={memberAvatar}
                                                        alt={memberName}
                                                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                                                    />
                                                ) : (
                                                    <div 
                                                        style={avatarStyle}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border border-border/40 shadow-2xs"
                                                    >
                                                        {initials}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate">
                                                        {memberName}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-1 font-medium">
                                                        {isOwner && <Shield className="w-3 h-3 text-amber-500" />}
                                                        {m.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {!isOwner && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(memberUserId)}
                                                    disabled={removeMemberMutation.isPending}
                                                    title="Remove member"
                                                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border bg-muted/20 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-1.5 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProjectMembersModal;
