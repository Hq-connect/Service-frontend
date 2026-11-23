import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import driveService from "../services/drive.service";
import { toast } from "sonner";

export const DRIVE_KEYS = {
  all: ["drive"],
  contents: (params) => ["drive", "contents", params],
  folder: (id) => ["drive", "folder", id],
  file: (id) => ["drive", "file", id],
  versions: (id) => ["drive", "versions", id],
  shares: (id) => ["drive", "shares", id],
  activity: (id) => ["drive", "activity", id],
};

/**
 * Fetch folder contents (subfolders and files)
 */
export function useDriveContents(params = {}) {
  return useQuery({
    queryKey: DRIVE_KEYS.contents(params),
    queryFn: () => driveService.listContents(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Fetch single folder details
 */
export function useFolderDetails(folderId) {
  return useQuery({
    queryKey: DRIVE_KEYS.folder(folderId),
    queryFn: () => driveService.getFolderDetails(folderId),
    enabled: !!folderId,
  });
}

/**
 * Create folder mutation
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentFolderId, isPublic }) =>
      driveService.createFolder({ name, parentFolderId, isPublic }),
    onSuccess: (newFolder) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success(`Folder "${newFolder.name}" created`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create folder");
    },
  });
}

/**
 * Update folder visibility mutation
 */
export function useUpdateFolderVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, isPublic }) =>
      driveService.updateFolderVisibility(folderId, isPublic),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success(
        updated?.isPublic
          ? "Folder is now public to workspace"
          : "Folder is now private"
      );
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update folder visibility"
      );
    },
  });
}

/**
 * Rename folder mutation
 */
export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, name }) => driveService.renameFolder(folderId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("Folder renamed");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to rename folder");
    },
  });
}

/**
 * Trash folder mutation
 */
export function useTrashFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId) => driveService.trashFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("Folder moved to trash");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to trash folder");
    },
  });
}

/**
 * Restore folder mutation
 */
export function useRestoreFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId) => driveService.restoreFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("Folder restored from trash");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to restore folder");
    },
  });
}

/**
 * Permanent delete folder mutation
 */
export function useDeleteFolderPermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId) => driveService.deleteFolderPermanently(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("Folder permanently deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to permanently delete folder");
    },
  });
}

/**
 * Direct-to-R2 upload mutation
 */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, folderId, isPublic = false, onProgress }) => {
      // 1. Request presigned upload URL from backend
      const uploadSession = await driveService.requestUploadUrl({
        name: file.name,
        folderId: folderId || null,
        mimeType: file.type || "application/octet-stream",
        isPublic,
      });

      // 2. Upload binary bytes directly to Cloudflare R2
      await driveService.uploadBytesToR2(
        uploadSession.uploadUrl,
        file,
        (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        }
      );

      // 3. Confirm with backend to activate the file
      return await driveService.completeUpload(
        uploadSession.fileId,
        uploadSession.versionId
      );
    },
    onSuccess: (uploadedFile) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success(`"${uploadedFile.name}" uploaded successfully`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || "File upload failed");
    },
  });
}

/**
 * Rename file mutation
 */
export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, name }) => driveService.renameFile(fileId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("File renamed");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to rename file");
    },
  });
}

/**
 * Star / Unstar file mutation
 */
export function useToggleStarFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId) => driveService.toggleStar(fileId),
    onSuccess: (file) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success(file.isStarred ? "Starred" : "Unstarred");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update star");
    },
  });
}

/**
 * Update file visibility mutation
 */
export function useUpdateFileVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, isPublic }) =>
      driveService.updateFileVisibility(fileId, isPublic),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success(
        updated?.isPublic
          ? "File is now public to workspace"
          : "File is now private"
      );
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update file visibility"
      );
    },
  });
}

/**
 * Trash file mutation
 */
export function useTrashFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId) => driveService.trashFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("File moved to trash");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to trash file");
    },
  });
}

/**
 * Restore file mutation
 */
export function useRestoreFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId) => driveService.restoreFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("File restored from trash");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to restore file");
    },
  });
}

/**
 * Permanent delete file mutation
 */
export function useDeleteFilePermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId) => driveService.deleteFilePermanently(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("File permanently deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to permanently delete file");
    },
  });
}

/**
 * Empty trash mutation
 */
export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => driveService.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.all });
      toast.success("Trash emptied");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to empty trash");
    },
  });
}

/**
 * Shares Query & Mutations
 */
export function useShares(targetId) {
  return useQuery({
    queryKey: DRIVE_KEYS.shares(targetId),
    queryFn: () => driveService.listShares(targetId),
    enabled: !!targetId,
  });
}

export function useGrantUserAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetType, targetId, subjectUserId, role }) =>
      driveService.grantUserAccess({ targetType, targetId, subjectUserId, role }),
    onSuccess: (share, variables) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.shares(variables.targetId) });
      toast.success(`Access granted as ${variables.role}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to grant access");
    },
  });
}

export function useCreateShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetType, targetId, role, expiresInDays }) =>
      driveService.createShareLink({ targetType, targetId, role, expiresInDays }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.shares(variables.targetId) });
      toast.success("Share link created");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create share link");
    },
  });
}

export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, targetId }) => driveService.revokeShare(shareId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DRIVE_KEYS.shares(variables.targetId) });
      toast.success("Access revoked");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to revoke access");
    },
  });
}

