import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentKeys } from "../queries/document.keys";
import documentService from "../services/document.service";

/**
 * Hook to manage a single document's metadata and lifecycle
 * @param {string} documentId
 */
export const useDocument = (documentId) => {
  const queryClient = useQueryClient();

  const {
    data: document,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: () => documentService.getDocumentById(documentId),
    enabled: Boolean(documentId),
    staleTime: 1000 * 60,
  });

  const updateMetadataMutation = useMutation({
    mutationFn: (updates) => documentService.updateDocument(documentId, updates),
    onSuccess: (updatedDoc) => {
      queryClient.setQueryData(documentKeys.detail(documentId), updatedDoc);
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => documentService.duplicateDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => documentService.archiveDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.tree() });
      queryClient.removeQueries({ queryKey: documentKeys.detail(documentId) });
    },
  });

  return {
    document,
    isLoading,
    isError,
    error,
    refetch,
    updateMetadata: updateMetadataMutation.mutateAsync,
    isUpdatingMetadata: updateMetadataMutation.isPending,
    duplicateDocument: duplicateMutation.mutateAsync,
    isDuplicating: duplicateMutation.isPending,
    archiveDocument: archiveMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,
    deleteDocument: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

export default useDocument;
