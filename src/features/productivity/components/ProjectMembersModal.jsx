import React, { useState } from 'react';
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from '../queries/project.queries';
import { useUsers } from '@/global/hooks/useUsers';
import { X, UserPlus, Trash2, Shield, User, Loader2, Check, AlertCircle, Search } from 'lucide-react';

export const ProjectMembersModal = ({ isOpen, onClose, projectId, projectName }) => {
    const { data: membersResponse, isLoading: isLoadingMembers } = useProjectMembers(projectId);
    const { data: tenantUsers, isLoading: isLoadingUsers, isError: isUsersError } = useUsers({ limit: 100 });

    const addMemberMutation = useAddProjectMember();
    const removeMemberMutation = useRemoveProjectMember();

    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
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
    // Filter tenant users who are not yet added to this project
    const availableUsers = allUsers.filter((u) => !memberUserIds.has(String(u._id)));

    const handleAddMember = (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        const targetUserId = useManualInput ? customUserId.trim() : selectedUserId;
        if (!targetUserId) {
            setErrorMessage('Please select or enter a user ID');
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

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in-0">
            <div className="bg-card text-card-foreground rounded-2xl border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-5 border-b shrink-0 bg-muted/20">
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
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shrink-0"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
                    {/* Alerts */}
                    {errorMessage && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-xs sm:text-sm rounded-xl border border-destructive/20 animate-in fade-in-50">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="flex-1 font-medium">{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-xs sm:text-sm rounded-xl border border-emerald-200 animate-in fade-in-50">
                            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span className="flex-1 font-medium">{successMessage}</span>
                        </div>
                    )}

                    {/* Add Member Form */}
                    <form onSubmit={handleAddMember} className="space-y-3 p-3.5 sm:p-4 bg-muted/40 rounded-xl border">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5 text-primary" />
                                Add Member
                            </label>
                            <button
                                type="button"
                                onClick={() => setUseManualInput(!useManualInput)}
                                className="text-[11px] text-primary hover:underline font-medium"
                            >
                                {useManualInput ? 'Choose from list' : 'Enter User ID directly'}
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                            {useManualInput ? (
                                <input
                                    type="text"
                                    placeholder="Enter 24-character User ID..."
                                    value={customUserId}
                                    onChange={(e) => setCustomUserId(e.target.value)}
                                    className="flex-1 h-10 sm:h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                                />
                            ) : (
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    disabled={isLoadingUsers || addMemberMutation.isPending}
                                    className="flex-1 h-10 sm:h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs truncate"
                                >
                                    <option value="">
                                        {isLoadingUsers ? 'Loading team members...' : 'Select team member...'}
                                    </option>
                                    {availableUsers.map((u) => {
                                        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                                        return (
                                            <option key={u._id} value={u._id}>
                                                {fullName} ({u.email})
                                            </option>
                                        );
                                    })}
                                </select>
                            )}

                            <div className="flex gap-2 shrink-0">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    disabled={addMemberMutation.isPending}
                                    className="flex-1 sm:flex-none h-10 sm:h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs capitalize"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                    <option value="viewer">Viewer</option>
                                </select>

                                <button
                                    type="submit"
                                    disabled={(!useManualInput && !selectedUserId) || (useManualInput && !customUserId.trim()) || addMemberMutation.isPending}
                                    className="h-10 sm:h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 transition-opacity shadow-xs"
                                >
                                    {addMemberMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Add</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {!useManualInput && availableUsers.length === 0 && !isLoadingUsers && (
                            <p className="text-[11px] text-muted-foreground">
                                All organization members are already added to this project, or you can switch to "Enter User ID directly" above.
                            </p>
                        )}
                    </form>

                    {/* Member List */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Current Members ({currentMembers.length})
                            </span>
                        </div>

                        {isLoadingMembers ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : currentMembers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm bg-muted/20 rounded-xl border border-dashed">
                                No members found in this project.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {currentMembers.map((m) => {
                                    const memberName = m.userSnapshot?.name || 'Member';
                                    const memberAvatar = m.userSnapshot?.avatar;
                                    const memberUserId = m.userId?._id ? String(m.userId._id) : String(m.userId);
                                    const isOwner = m.role === 'owner';

                                    return (
                                        <div
                                            key={m._id || memberUserId}
                                            className="flex items-center justify-between p-2.5 sm:p-3 bg-card rounded-xl border hover:border-border transition-colors gap-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {memberAvatar ? (
                                                    <img
                                                        src={memberAvatar}
                                                        alt={memberName}
                                                        className="w-8 h-8 rounded-full object-cover border shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                                                        {memberName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        {memberName}
                                                    </p>
                                                    <span className="text-[11px] text-muted-foreground capitalize flex items-center gap-1 font-medium">
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
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                <div className="p-3.5 sm:p-4 border-t bg-muted/20 flex justify-end shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
