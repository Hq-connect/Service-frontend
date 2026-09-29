import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "../queries/document.keys";
import versionService from "../services/version.service";

/**
 * Hook to manage document version history
 * @param {string} documentId
 */
export const useDocumentVersions = (documentId) => {
  const queryClient = useQueryClient();

  const {
    data: versionsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: documentKeys.versions(documentId),
    queryFn: () => versionService.getVersions(documentId, { limit: 50 }),
    enabled: Boolean(documentId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const versions = versionsData?.versions || [];

  const createVersionMutation = useMutation({
    mutationFn: (payload) => versionService.createVersion(documentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(documentId) });
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: (versionId) => versionService.restoreVersion(documentId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(documentId) });
    },
  });

  return {
    versions,
    total: versionsData?.total || 0,
    isLoading,
    isError,
    refetch,
    createVersion: createVersionMutation.mutateAsync,
    isCreatingVersion: createVersionMutation.isPending,
    restoreVersion: restoreVersionMutation.mutateAsync,
    isRestoringVersion: restoreVersionMutation.isPending,
  };
};

export default useDocumentVersions;
