import { useState } from "react";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  CheckCircle2,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  Send,
  Ban,
  RotateCcw,
  Users,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import useAuth from "@/features/auth/hooks/useAuth";
import {
  extractUser,
  getInitials,
  getUserDisplayName as getUserName,
  getAvatarStyle,
} from "@/global/utils/user";
import useWorkspaceUsers from "../hooks/useWorkspaceUsers";
import useWorkspaceInvites from "../hooks/useWorkspaceInvites";

function formatShortDate(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function StatusPill({ status }) {
  if (status === "active" || status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-status-live-border bg-status-live px-2 py-0.5 text-[11px] font-medium text-status-live-foreground capitalize">
        <span className="size-1.5 rounded-full bg-status-live-foreground" />
        {status}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-status-warn-border bg-status-warn px-2 py-0.5 text-[11px] font-medium text-status-warn-foreground capitalize">
        <span className="size-1.5 rounded-full bg-status-warn-foreground" />
        Pending
      </span>
    );
  }
  if (status === "suspended" || status === "revoked" || status === "deleted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive capitalize">
        {status}
      </span>
    );
  }
  return (
    <Badge variant="outline" className="capitalize text-[11px]">
      {status || "unknown"}
    </Badge>
  );
}

export function MembersAndInvitesPage() {
  const { user: currentUser } = useAuth();
  const currentUserId =
    extractUser(currentUser)?._id || extractUser(currentUser)?.id;

  const {
    users = [],
    stats,
    pagination: userPagination = { page: 1, limit: 20, total: 0, totalPages: 0 },
    filters: userFilters = { search: "", role: "", status: "", page: 1, limit: 20 },
    updateFilters: updateUserFilters,
    resetFilters: resetUserFilters,
    isLoading: isLoadingUsers,
    approveUser,
    isApproving,
    changeUserRole,
    changeUserStatus,
    removeUser,
  } = useWorkspaceUsers();

  const {
    invitations = [],
    pagination: invitePagination = { page: 1, limit: 20, total: 0, totalPages: 0 },
    filters: inviteFilters = { status: "pending", page: 1, limit: 20 },
    updateFilters: updateInviteFilters,
    openInviteModal,
    isLoading: isLoadingInvites,
    resendInvitation,
    isResending,
    revokeInvitation,
    isRevoking,
  } = useWorkspaceInvites();

  const [activeTab, setActiveTab] = useState("members");
  const [actionBanner, setActionBanner] = useState(null);

  const handleAction = async (fn, successMsg) => {
    setActionBanner(null);
    try {
      await fn();
      setActionBanner({ type: "success", message: successMsg });
    } catch (err) {
      setActionBanner({
        type: "error",
        message:
          err?.response?.data?.message || "Action could not be completed.",
      });
    }
  };

  const totalMembersCount = stats?.totalUsers ?? stats?.total ?? users.length;
  const pendingApprovalCount = stats?.pendingUsers ?? stats?.pending ?? 0;
  const pendingInvitesCount =
    stats?.pendingInvites ?? invitePagination?.total ?? invitations.length;

  const kpis = [
    { label: "Total members", value: totalMembersCount },
    { label: "Active", value: stats?.active ?? 0 },
    { label: "Pending approval", value: pendingApprovalCount },
    {
      label: "Pending invites",
      value: pendingInvitesCount,
    },
    { label: "Suspended", value: stats?.suspended ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Members & invitations
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage workspace access, approve pending requests, and send email invitations.
          </p>
        </div>

        <Button size="sm" onClick={openInviteModal} className="shrink-0">
          <UserPlus className="size-3.5 mr-1.5" />
          Invite members
        </Button>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-foreground tabular-nums">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {actionBanner && (
        <div
          className={`rounded-lg border px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 ${
            actionBanner.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-status-live-border bg-status-live/50 text-status-live-foreground"
          }`}
        >
          <span>{actionBanner.message}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-xs underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs: Members vs Invitations */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <TabsList>
            <TabsTrigger value="members" className="gap-1.5 px-3">
              <Users className="size-3.5" />
              Members
              <span className="ml-1 font-mono text-[11px] tabular-nums opacity-75">
                ({totalMembersCount})
              </span>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-1.5 px-3">
              <Mail className="size-3.5" />
              Invitations
              <span className="ml-1 font-mono text-[11px] tabular-nums opacity-75">
                ({invitePagination?.total ?? invitations.length})
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Search by name or email…"
                value={userFilters.search}
                onChange={(e) =>
                  updateUserFilters({ search: e.target.value })
                }
                className="pl-8"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={userFilters.role || "all"}
                onValueChange={(val) =>
                  updateUserFilters({ role: val === "all" ? "" : val })
                }
              >
                <SelectTrigger className="w-32 capitalize">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={userFilters.status || "all"}
                onValueChange={(val) =>
                  updateUserFilters({ status: val === "all" ? "" : val })
                }
              >
                <SelectTrigger className="w-36 capitalize">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending approval</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>

              {(userFilters.search ||
                userFilters.role ||
                userFilters.status) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetUserFilters}
                  className="text-xs text-muted-foreground"
                >
                  <RotateCcw className="size-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Members Table Card */}
          <div className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  [1, 2, 3, 4].map((n) => (
                    <TableRow key={n}>
                      <TableCell colSpan={5} className="h-14">
                        <div className="h-6 rounded bg-muted/60 animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-xs text-muted-foreground"
                    >
                      No workspace members match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((member) => {
                    const memberId = member._id || member.id;
                    const isSelf =
                      currentUserId &&
                      String(memberId) === String(currentUserId);
                    const isMemberOwner = member.role === "owner";

                    return (
                      <TableRow key={memberId}>
                        <TableCell className="pl-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar size="default">
                              {member.avatar && (
                                <AvatarImage
                                  src={member.avatar}
                                  alt={getUserName(member)}
                                />
                              )}
                              <AvatarFallback
                                style={getAvatarStyle(member)}
                                className="font-bold text-xs font-heading"
                              >
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {getUserName(member)}
                                </span>
                                {isSelf && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] h-4 px-1.5"
                                  >
                                    You
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              member.role === "owner" ? "default" : "secondary"
                            }
                            className="capitalize text-[11px]"
                          >
                            {member.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <StatusPill status={member.status} />
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {formatShortDate(member.createdAt)}
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {member.status === "pending" && (
                              <Button
                                type="button"
                                size="xs"
                                disabled={isApproving}
                                onClick={() =>
                                  handleAction(
                                    () => approveUser(memberId),
                                    `Approved ${member.email}.`
                                  )
                                }
                              >
                                <CheckCircle2 className="size-3 mr-1" />
                                Approve
                              </Button>
                            )}

                            {!isSelf && !isMemberOwner && (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      aria-label="Member actions"
                                    />
                                  }
                                >
                                  <MoreHorizontal className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  {member.status === "pending" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAction(
                                          () => approveUser(memberId),
                                          `Approved ${member.email}.`
                                        )
                                      }
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                      Approve request
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction(
                                        () =>
                                          changeUserRole({
                                            targetUserId: memberId,
                                            role:
                                              member.role === "admin"
                                                ? "member"
                                                : "admin",
                                          }),
                                        `Updated role for ${member.email}.`
                                      )
                                    }
                                  >
                                    <Shield className="size-3.5" />
                                    {member.role === "admin"
                                      ? "Change to Member"
                                      : "Make Admin"}
                                  </DropdownMenuItem>

                                  {member.status !== "pending" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAction(
                                          () =>
                                            changeUserStatus({
                                              targetUserId: memberId,
                                              status:
                                                member.status === "suspended"
                                                  ? "active"
                                                  : "suspended",
                                            }),
                                          member.status === "suspended"
                                            ? `Reactivated ${member.email}.`
                                            : `Suspended ${member.email}.`
                                        )
                                      }
                                    >
                                      {member.status === "suspended" ? (
                                        <>
                                          <UserCheck className="size-3.5" />
                                          Reactivate account
                                        </>
                                      ) : (
                                        <>
                                          <UserX className="size-3.5" />
                                          Suspend account
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() =>
                                      handleAction(
                                        () => removeUser(memberId),
                                        `Removed ${member.email} from workspace.`
                                      )
                                    }
                                  >
                                    <Trash2 className="size-3.5" />
                                    Remove member
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination Footer */}
            {userPagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  Page {userPagination.page} of {userPagination.totalPages} ·{" "}
                  {userPagination.total} total
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={userPagination.page <= 1}
                    onClick={() =>
                      updateUserFilters({ page: userPagination.page - 1 })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={userPagination.page >= userPagination.totalPages}
                    onClick={() =>
                      updateUserFilters({ page: userPagination.page + 1 })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* INVITATIONS TAB */}
        <TabsContent value="invitations" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Select
                value={inviteFilters.status || "pending"}
                onValueChange={(val) => updateInviteFilters({ status: val })}
              >
                <SelectTrigger className="w-36 capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Invited email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvites ? (
                  [1, 2, 3].map((n) => (
                    <TableRow key={n}>
                      <TableCell colSpan={5} className="h-12">
                        <div className="h-5 rounded bg-muted/60 animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : invitations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-xs text-muted-foreground"
                    >
                      No invitations found with status &ldquo;
                      {inviteFilters.status}&rdquo;.
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((inv) => {
                    const invId = inv._id || inv.id;
                    const canManage =
                      inv.status === "pending" || inv.status === "expired";

                    return (
                      <TableRow key={invId}>
                        <TableCell className="pl-4 py-3 font-mono text-xs text-foreground">
                          {inv.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="capitalize text-[11px]"
                          >
                            {inv.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusPill status={inv.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {formatShortDate(inv.expiresAt)}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          {canManage && (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={isResending}
                                onClick={() =>
                                  handleAction(
                                    () => resendInvitation(invId),
                                    `Resent invitation to ${inv.email}.`
                                  )
                                }
                              >
                                <Send className="size-3 mr-1" />
                                Resend
                              </Button>
                              {inv.status === "pending" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  disabled={isRevoking}
                                  onClick={() =>
                                    handleAction(
                                      () => revokeInvitation(invId),
                                      `Revoked invitation for ${inv.email}.`
                                    )
                                  }
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Ban className="size-3 mr-1" />
                                  Revoke
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {invitePagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  Page {invitePagination.page} of {invitePagination.totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={invitePagination.page <= 1}
                    onClick={() =>
                      updateInviteFilters({ page: invitePagination.page - 1 })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={
                      invitePagination.page >= invitePagination.totalPages
                    }
                    onClick={() =>
                      updateInviteFilters({ page: invitePagination.page + 1 })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MembersAndInvitesPage;

