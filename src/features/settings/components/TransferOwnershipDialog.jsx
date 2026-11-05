import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  extractUser,
  getUserDisplayName,
} from "@/global/utils/user";
import { settingsKeys } from "../queries/settings.keys";
import userManagementService from "../services/userManagement.service";
import useOwnerSettings from "../hooks/useOwnerSettings";
import ConfirmDangerDialog from "./ConfirmDangerDialog";

/**
 * Pick an active member and hand over ownership.
 * The picker uses its own query (fixed filters) so it never disturbs the
 * filters of the Members page.
 */
export function TransferOwnershipDialog({ open, onOpenChange, currentUserId }) {
  const [newOwnerId, setNewOwnerId] = useState("");
  const { transferOwnership, isTransferring } = useOwnerSettings();

  const pickerFilters = { page: 1, limit: 100, status: "active" };
  const { data, isLoading } = useQuery({
    queryKey: settingsKeys.userList({ ...pickerFilters, picker: "ownership" }),
    queryFn: () => userManagementService.getUsers(pickerFilters),
    enabled: open,
    staleTime: 30 * 1000,
  });

  const candidates = (Array.isArray(data?.users) ? data.users : []).filter(
    (u) =>
      u.role !== "owner" &&
      String(u._id || u.id) !== String(currentUserId)
  );

  const selected = candidates.find(
    (u) => String(u._id || u.id) === String(newOwnerId)
  );
  const selectedName = selected
    ? getUserDisplayName(extractUser(selected))
    : "";

  const handleOpenChange = (next) => {
    if (!next) setNewOwnerId("");
    onOpenChange(next);
  };

  return (
    <ConfirmDangerDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Transfer workspace ownership"
      description="Choose an active member to become the new owner. This takes effect immediately."
      consequences={[
        "You will become an admin and lose owner-only controls.",
        "The new owner can transfer ownership again or sign everyone out.",
        "This action is recorded in the audit log.",
      ]}
      confirmLabel="Transfer ownership"
      isLoading={isTransferring}
      onConfirm={(password) => {
        if (!newOwnerId) {
          const err = new Error("Select a member first");
          err.response = { data: { message: "Select a member to become the new owner." } };
          throw err;
        }
        return transferOwnership({ newOwnerId, password });
      }}
    >
      <div className="space-y-1.5">
        <Label className="text-xs">New owner</Label>
        <Select value={newOwnerId} onValueChange={setNewOwnerId}>
          <SelectTrigger className="w-full" disabled={isLoading}>
            <SelectValue>
              {selected ? (
                <span className="truncate">{selectedName}</span>
              ) : (
                <span className="text-muted-foreground">
                  {isLoading ? "Loading members…" : "Select a member"}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {candidates.length === 0 ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">
                No other active members available.
              </div>
            ) : (
              candidates.map((u) => {
                const id = String(u._id || u.id);
                return (
                  <SelectItem key={id} value={id}>
                    <span className="truncate">
                      {getUserDisplayName(extractUser(u))}
                    </span>
                    <span className="ml-1 text-[11px] text-muted-foreground font-mono truncate">
                      {u.email}
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-auto capitalize text-[10px] h-4 px-1.5"
                    >
                      {u.role}
                    </Badge>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>
    </ConfirmDangerDialog>
  );
}

export default TransferOwnershipDialog;

