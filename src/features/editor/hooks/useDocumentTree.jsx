import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "../queries/document.keys";
import folderService from "../services/folder.service";
import documentService from "../services/document.service";

/**
 * Hook to manage the hierarchical document & folder tree
 * Powers the secondary sidebar navigation and dashboard tree
 */
export const useDocumentTree = () => {
  const queryClient = useQueryClient();

  const {
    data = { folders: [], rootDocuments: [] },
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: documentKeys.tree(),
    queryFn: folderService.getTree,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time; refreshed automatically on socket events
  });

  const invalidateTree = () => {
    queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
    queryClient.invalidateQueries({ queryKey: documentKeys.all });
  };

  const createFolderMutation = useMutation({
    mutationFn: folderService.createFolder,
    onSuccess: () => invalidateTree(),
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, updates }) => folderService.updateFolder(id, updates),
    onSuccess: () => invalidateTree(),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: folderService.deleteFolder,
    onSuccess: () => invalidateTree(),
  });

  const createDocumentMutation = useMutation({
    mutationFn: documentService.createDocument,
    onSuccess: () => invalidateTree(),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: () => invalidateTree(),
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: documentService.archiveDocument,
    onSuccess: () => invalidateTree(),
  });

  return {
    folders: data.folders || [],
    rootDocuments: data.rootDocuments || [],
    isLoading,
    isError,
    error,
    refetch,
    // Mutations
    createFolder: createFolderMutation.mutateAsync,
    isCreatingFolder: createFolderMutation.isPending,
    updateFolder: updateFolderMutation.mutateAsync,
    isUpdatingFolder: updateFolderMutation.isPending,
    deleteFolder: deleteFolderMutation.mutateAsync,
    isDeletingFolder: deleteFolderMutation.isPending,
    createDocument: createDocumentMutation.mutateAsync,
    isCreatingDocument: createDocumentMutation.isPending,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    isDeletingDocument: deleteDocumentMutation.isPending,
    archiveDocument: archiveDocumentMutation.mutateAsync,
    isArchivingDocument: archiveDocumentMutation.isPending,
  };
};

export default useDocumentTree;
