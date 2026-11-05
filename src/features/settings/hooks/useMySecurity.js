import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { settingsKeys } from "../queries/settings.keys";
import memberSettingsService from "../services/memberSettings.service";
import { removeUser } from "@/features/auth/states/auth.states";

export const useMySecurity = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    data: sessionsData = [],
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: settingsKeys.sessions(),
    queryFn: () => memberSettingsService.getSessions(),
    staleTime: 30 * 1000,
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId) => memberSettingsService.revokeSession(sessionId),
    onSuccess: (result) => {
      if (result?.isCurrentSession) {
        dispatch(removeUser());
        queryClient.clear();
        toast.info("Current session signed out");
        navigate("/auth/login", { replace: true });
        return;
      }
      queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() });
      toast.success("Session revoked successfully");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to revoke session";
      toast.error(msg);
    },
  });

  const revokeOtherSessionsMutation = useMutation({
    mutationFn: () => memberSettingsService.revokeOtherSessions(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.sessions() });
      const count = result?.removedCount ?? 0;
      toast.success(
        count > 0
          ? `Signed out of ${count} other session(s)`
          : "No other active sessions found"
      );
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to sign out other sessions";
      toast.error(msg);
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      memberSettingsService.updatePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to update password";
      toast.error(msg);
    },
  });

  const sessions = Array.isArray(sessionsData)
    ? sessionsData
    : Array.isArray(sessionsData?.sessions)
      ? sessionsData.sessions
      : [];

  return {
    sessions,
    isLoadingSessions,
    isSessionsError,
    sessionsError,
    refetchSessions,
    revokeSession: revokeSessionMutation.mutateAsync,
    isRevokingSession: revokeSessionMutation.isPending,
    revokeOtherSessions: revokeOtherSessionsMutation.mutateAsync,
    revokeAllOtherSessions: revokeOtherSessionsMutation.mutateAsync,
    isRevokingOtherSessions: revokeOtherSessionsMutation.isPending,
    isRevokingAllOthers: revokeOtherSessionsMutation.isPending,
    updatePassword: updatePasswordMutation.mutateAsync,
    changePassword: updatePasswordMutation.mutateAsync,
    isUpdatingPassword: updatePasswordMutation.isPending,
    isChangingPassword: updatePasswordMutation.isPending,
  };
};

export default useMySecurity;
