import { useState } from "react";
import { Crown, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuth from "@/features/auth/hooks/useAuth";
import { extractUser } from "@/global/utils/user";
import SettingsSectionCard from "../components/SettingsSectionCard";
import TransferOwnershipDialog from "../components/TransferOwnershipDialog";
import ConfirmDangerDialog from "../components/ConfirmDangerDialog";
import useOwnerSettings from "../hooks/useOwnerSettings";

export function OwnerDangerZonePage() {
  const { user } = useAuth();
  const currentUserId = extractUser(user)?._id;
  const { revokeAllSessions, isRevokingAll } = useOwnerSettings();

  const [transferOpen, setTransferOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Danger zone
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            <ShieldAlert className="size-3" />
            Owner only
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          High-impact workspace actions. Each one asks for your password and is
          recorded in the audit log.
        </p>
      </div>

      <SettingsSectionCard
        danger
        title="Transfer ownership"
        description="Hand this workspace to another active member. You will be demoted to admin."
        footer={
          <>
            <span className="text-xs text-muted-foreground">
              The new owner is notified by email.
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setTransferOpen(true)}
            >
              <Crown className="size-3.5 mr-1.5" />
              Transfer ownership
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Only one owner can exist at a time. Ownership moves atomically, so the
          workspace is never left without an owner.
        </p>
      </SettingsSectionCard>

      <SettingsSectionCard
        danger
        title="Sign out everyone else"
        description="Immediately end every active session of all admins and members."
        footer={
          <>
            <span className="text-xs text-muted-foreground">
              Your own sessions stay signed in. Accounts are not suspended.
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setRevokeOpen(true)}
            >
              <LogOut className="size-3.5 mr-1.5" />
              Revoke all sessions
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Use this after a suspected credential leak. Members will need to log in
          again on every device.
        </p>
      </SettingsSectionCard>

      <TransferOwnershipDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        currentUserId={currentUserId}
      />

      <ConfirmDangerDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Sign out all other members?"
        description="Every admin and member will be signed out on all devices."
        consequences={[
          "Unsaved work in open tabs may be lost.",
          "Your own sessions are not affected.",
        ]}
        confirmLabel="Revoke all sessions"
        isLoading={isRevokingAll}
        onConfirm={(password) => revokeAllSessions({ password })}
      />
    </div>
  );
}

export default OwnerDangerZonePage;

