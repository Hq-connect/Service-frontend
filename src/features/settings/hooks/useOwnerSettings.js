import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { settingsKeys } from "../queries/settings.keys";
import ownerService from "../services/owner.service";
import { setUser } from "@/features/auth/states/auth.states";
import { extractUser } from "@/global/utils/user";

export const useOwnerSettings = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const rawUser = useSelector((state) => state.auth.user);

  const invalidateAfterOwnerAction = () => {
    queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
    queryClient.invalidateQueries({ queryKey: settingsKeys.workspace() });
    queryClient.invalidateQueries({ queryKey: settingsKeys.auditLogs() });
  };

  const transferOwnershipMutation = useMutation({
    mutationFn: ({ newOwnerId, password }) =>
      ownerService.transferOwnership({ newOwnerId, password }),
    onSuccess: () => {
      // The backend already patched our cached session role to "admin";
      // mirror it locally so owner-only UI disappears without a reload.
      const current = extractUser(rawUser);
      if (current) {
        dispatch(setUser({ user: { ...current, role: "admin" } }));
      }
      invalidateAfterOwnerAction();
      toast.success("Ownership transferred. You are now an admin.");
      navigate("/settings/profile", { replace: true });
    },
    // Errors (e.g. wrong password) are surfaced inline by the dialog
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: ({ password }) => ownerService.revokeAllSessions({ password }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.auditLogs() });
      const sessions = result?.sessionsRevoked ?? 0;
      const users = result?.usersAffected ?? 0;
      toast.success(
        sessions > 0
          ? `Signed out ${users} member(s) across ${sessions} session(s)`
          : "No other active sessions were found"
      );
    },
  });

  return {
    transferOwnership: transferOwnershipMutation.mutateAsync,
    isTransferring: transferOwnershipMutation.isPending,
    revokeAllSessions: revokeAllSessionsMutation.mutateAsync,
    isRevokingAll: revokeAllSessionsMutation.isPending,
  };
};

export default useOwnerSettings;

