import {
  ScrollText,
  RotateCcw,
  Shield,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import useAuditLogs from "../hooks/useAuditLogs";

const AUDIT_ACTIONS = [
  { value: "all", label: "All actions" },
  { value: "workspace.updated", label: "workspace.updated" },
  { value: "branding.identity_updated", label: "branding.identity_updated" },
  { value: "branding.theme_updated", label: "branding.theme_updated" },
  { value: "branding.meeting_updated", label: "branding.meeting_updated" },
  { value: "branding.reset", label: "branding.reset" },
  { value: "user.invited", label: "user.invited" },
  { value: "user.approved", label: "user.approved" },
  { value: "user.role_changed", label: "user.role_changed" },
  { value: "user.status_changed", label: "user.status_changed" },
  { value: "user.removed", label: "user.removed" },
  { value: "invite.accepted", label: "invite.accepted" },
  { value: "invite.resent", label: "invite.resent" },
  { value: "invite.revoked", label: "invite.revoked" },
  { value: "owner.ownership_transferred", label: "owner.ownership_transferred" },
  { value: "owner.sessions_revoked", label: "owner.sessions_revoked" },
];

const TARGET_TYPES = [
  { value: "all", label: "All targets" },
  { value: "workspace", label: "Workspace" },
  { value: "branding", label: "Branding" },
  { value: "user", label: "User / Invite" },
];

function formatTimestamp(iso) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function summarizeMetadata(meta) {
  if (!meta || typeof meta !== "object") return "—";
  const entries = Object.entries(meta).filter(
    ([, val]) => val !== undefined && val !== null && val !== ""
  );
  if (entries.length === 0) return "—";

  return entries
    .map(([key, val]) => {
      if (Array.isArray(val)) return `${key}: [${val.join(", ")}]`;
      if (typeof val === "object") return `${key}: ${JSON.stringify(val)}`;
      return `${key}: ${String(val)}`;
    })
    .join(" · ");
}

export function AuditLogsPage() {
  const {
    logs,
    pagination,
    filters,
    updateFilters,
    resetFilters,
    isLoading,
  } = useAuditLogs();

  const hasActiveFilters =
    filters.action || filters.targetType || filters.from || filters.to;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Audit logs
        </h1>
        <p className="text-xs text-muted-foreground">
          Immutable security and administrative event trail for your workspace.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-card) space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Event action
            </label>
            <Select
              value={filters.action || "all"}
              onValueChange={(val) =>
                updateFilters({ action: val === "all" ? "" : val })
              }
            >
              <SelectTrigger className="w-full font-mono text-xs">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_ACTIONS.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    className="font-mono text-xs"
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Target resource
            </label>
            <Select
              value={filters.targetType || "all"}
              onValueChange={(val) =>
                updateFilters({ targetType: val === "all" ? "" : val })
              }
            >
              <SelectTrigger className="w-full capitalize">
                <SelectValue placeholder="All targets" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" /> From date
            </label>
            <Input
              type="date"
              value={filters.from || ""}
              onChange={(e) => updateFilters({ from: e.target.value })}
              className="text-xs tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="size-3" /> To date
            </label>
            <Input
              type="date"
              value={filters.to || ""}
              onChange={(e) => updateFilters({ to: e.target.value })}
              className="text-xs tabular-nums"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <RotateCcw className="size-3 mr-1" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-border bg-card shadow-(--shadow-card) overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-4">Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right pr-4">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((n) => (
                <TableRow key={n}>
                  <TableCell colSpan={6} className="h-12">
                    <div className="h-5 rounded bg-muted/60 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <ScrollText className="size-5 text-muted-foreground/60" />
                    <span>No audit log events match the selected filters.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id || log.id}>
                  <TableCell className="pl-4 py-3 text-xs text-muted-foreground font-mono tabular-nums">
                    {formatTimestamp(log.createdAt)}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[11px]"
                    >
                      {log.action}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Shield className="size-3 text-muted-foreground shrink-0" />
                      <span className="text-xs capitalize text-foreground">
                        {log.actorRole || "system"}
                      </span>
                      {log.actorId && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          ({String(log.actorId).slice(-6)})
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs capitalize text-muted-foreground">
                      {log.targetType}
                    </span>
                  </TableCell>

                  <TableCell className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">
                    {summarizeMetadata(log.metadata)}
                  </TableCell>

                  <TableCell className="text-right pr-4 font-mono text-xs text-muted-foreground tabular-nums">
                    {log.ip || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} events
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page <= 1}
                onClick={() => updateFilters({ page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateFilters({ page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogsPage;

