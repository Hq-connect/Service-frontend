import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { settingsKeys } from "../queries/settings.keys";
import userManagementService from "../services/userManagement.service";
import {
  setUserFilters,
  resetUserFilters,
  setSelectedUserId,
} from "../states/settings.slice";

export const useWorkspaceUsers = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { userFilters, selectedUserId } = useSelector((state) => state.settings);

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: settingsKeys.userList(userFilters),
    queryFn: () => userManagementService.getUsers(userFilters),
    staleTime: 30 * 1000,
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: settingsKeys.userStats(),
    queryFn: () => userManagementService.getUserStats(),
    staleTime: 30 * 1000,
  });

  const {
    data: selectedUser,
    isLoading: isLoadingSelectedUser,
  } = useQuery({
    queryKey: settingsKeys.userDetail(selectedUserId),
    queryFn: () => userManagementService.getUserById(selectedUserId),
    enabled: Boolean(selectedUserId),
  });

  const invalidateUserQueries = () => {
    queryClient.invalidateQueries({ queryKey: settingsKeys.users() });
    queryClient.invalidateQueries({ queryKey: settingsKeys.auditLogs() });
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, targetUserId, role }) =>
      userManagementService.updateUserRole(targetUserId || userId, role),
    onSuccess: (updatedUser) => {
      invalidateUserQueries();
      toast.success(`Role updated to '${updatedUser?.role || "updated"}'`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user role");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, targetUserId, status }) =>
      userManagementService.updateUserStatus(targetUserId || userId, status),
    onSuccess: (_updatedUser, variables) => {
      invalidateUserQueries();
      toast.success(`User status updated to '${variables.status}'`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user status");
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId) => userManagementService.removeUser(userId),
    onSuccess: (_res, userId) => {
      if (selectedUserId === userId) {
        dispatch(setSelectedUserId(null));
      }
      invalidateUserQueries();
      toast.success("Member removed from workspace");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to remove member");
    },
  });

  const usersList = Array.isArray(usersData?.users) ? usersData.users : [];
  const updateFilters = (patch) => dispatch(setUserFilters(patch));
  const approveUser = (userId) =>
    updateStatusMutation.mutateAsync({ userId, status: "active" });

  return {
    users: usersList,
    pagination: usersData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    stats: stats || null,
    selectedUser: selectedUser || null,
    selectedUserId,
    filters: userFilters,
    isLoading: isLoadingUsers,
    isLoadingUsers,
    isLoadingStats,
    isLoadingSelectedUser,
    isUsersError,
    usersError,
    refetchUsers,
    refetchStats,
    setFilters: updateFilters,
    updateFilters,
    resetFilters: () => dispatch(resetUserFilters()),
    selectUser: (userId) => dispatch(setSelectedUserId(userId)),
    updateRole: updateRoleMutation.mutateAsync,
    changeUserRole: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    changeUserStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    approvePendingUser: approveUser,
    approveUser,
    isApproving: updateStatusMutation.isPending,
    removeUser: removeUserMutation.mutateAsync,
    isRemovingUser: removeUserMutation.isPending,
  };
};

export default useWorkspaceUsers;
