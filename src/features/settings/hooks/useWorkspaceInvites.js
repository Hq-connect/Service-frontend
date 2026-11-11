import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { settingsKeys } from "../queries/settings.keys";
import userManagementService from "../services/userManagement.service";
import {
  setInviteFilters,
  resetInviteFilters,
  setInviteModalOpen,
} from "../states/settings.slice";

export const useWorkspaceInvites = (options = { fetchList: true }) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { inviteFilters, isInviteModalOpen } = useSelector((state) => state.settings);

  const {
    data: invitesData,
    isLoading: isLoadingInvites,
    isError: isInvitesError,
    error: invitesError,
    refetch: refetchInvites,
  } = useQuery({
    queryKey: settingsKeys.inviteList(inviteFilters),
    queryFn: () => userManagementService.getInvites(inviteFilters),
    enabled: Boolean(options?.fetchList),
    staleTime: 30 * 1000,
  });

  const invalidateInviteQueries = () => {
    queryClient.invalidateQueries({ queryKey: settingsKeys.invites() });
    queryClient.invalidateQueries({ queryKey: settingsKeys.userStats() });
    queryClient.invalidateQueries({ queryKey: settingsKeys.auditLogs() });
  };

  const sendInvitesMutation = useMutation({
    mutationFn: (invitesPayload) => userManagementService.inviteUsers(invitesPayload),
    onSuccess: (result) => {
      invalidateInviteQueries();
      const sentCount = result?.invited?.length || 0;
      const skippedCount = result?.skipped?.length || 0;

      if (sentCount > 0 && skippedCount === 0) {
        toast.success(`Sent ${sentCount} invitation(s) successfully`);
      } else if (sentCount > 0 && skippedCount > 0) {
        toast.warning(
          `Sent ${sentCount} invitation(s); ${skippedCount} skipped`,
          {
            description: result.skipped.map((s) => `${s.email}: ${s.reason}`).join(" • "),
          }
        );
      } else if (skippedCount > 0) {
        toast.error("No invitations were sent", {
          description: result.skipped.map((s) => `${s.email}: ${s.reason}`).join(" • "),
        });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to send invitations");
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: (inviteId) => userManagementService.resendInvite(inviteId),
    onSuccess: () => {
      invalidateInviteQueries();
      toast.success("Invitation resent with a fresh link");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to resend invitation");
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId) => userManagementService.revokeInvite(inviteId),
    onSuccess: () => {
      invalidateInviteQueries();
      toast.success("Invitation revoked");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to revoke invitation");
    },
  });

  const invitesList = Array.isArray(invitesData?.invites) ? invitesData.invites : [];
  const updateFilters = (patch) => dispatch(setInviteFilters(patch));

  return {
    invites: invitesList,
    invitations: invitesList,
    pagination: invitesData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    filters: inviteFilters,
    isInviteModalOpen,
    isLoading: isLoadingInvites,
    isLoadingInvites,
    isInvitesError,
    invitesError,
    refetchInvites,
    setFilters: updateFilters,
    updateFilters,
    resetFilters: () => dispatch(resetInviteFilters()),
    openInviteModal: () => dispatch(setInviteModalOpen(true)),
    closeInviteModal: () => dispatch(setInviteModalOpen(false)),
    setInviteModalOpen: (open) => dispatch(setInviteModalOpen(open)),
    sendInvites: sendInvitesMutation.mutateAsync,
    inviteUsers: sendInvitesMutation.mutateAsync,
    isSendingInvites: sendInvitesMutation.isPending,
    isInviting: sendInvitesMutation.isPending,
    resendInvite: resendInviteMutation.mutateAsync,
    resendInvitation: resendInviteMutation.mutateAsync,
    isResendingInvite: resendInviteMutation.isPending,
    isResending: resendInviteMutation.isPending,
    revokeInvite: revokeInviteMutation.mutateAsync,
    revokeInvitation: revokeInviteMutation.mutateAsync,
    isRevokingInvite: revokeInviteMutation.isPending,
    isRevoking: revokeInviteMutation.isPending,
  };
};

export default useWorkspaceInvites;
