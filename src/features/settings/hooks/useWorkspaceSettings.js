import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { settingsKeys } from "../queries/settings.keys";
import workspaceService from "../services/workspace.service";
import { setTenantData } from "@/global/states/tenant.slice";

export const useWorkspaceSettings = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const currentTenant = useSelector((state) => state.tenant.tenant);

  const {
    data: workspace,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: settingsKeys.workspace(),
    queryFn: () => workspaceService.getWorkspace(),
    staleTime: 60 * 1000,
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: (updateData) => {
      const normalizedPayload = {
        ...(updateData?.settings || {}),
        ...updateData,
      };
      delete normalizedPayload.settings;
      return workspaceService.updateWorkspace(normalizedPayload);
    },
    onSuccess: (updatedWorkspace) => {
      queryClient.setQueryData(settingsKeys.workspace(), updatedWorkspace);
      queryClient.invalidateQueries({ queryKey: settingsKeys.auditLogs() });

      // Sync global Redux tenant state so headers/sidebars reflect the updated name & settings
      if (updatedWorkspace) {
        dispatch(
          setTenantData({
            ...(currentTenant || {}),
            ...updatedWorkspace,
            settings: {
              timezone: updatedWorkspace.timezone,
              language: updatedWorkspace.language,
              allowedEmailDomains: updatedWorkspace.allowedEmailDomains,
            },
          })
        );
      }

      toast.success("Workspace settings updated successfully");
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to update workspace settings";
      toast.error(msg);
    },
  });

  return {
    workspace,
    isLoading,
    isError,
    error,
    refetch,
    updateWorkspace: updateWorkspaceMutation.mutateAsync,
    isUpdating: updateWorkspaceMutation.isPending,
    isUpdatingWorkspace: updateWorkspaceMutation.isPending,
  };
};

export default useWorkspaceSettings;
