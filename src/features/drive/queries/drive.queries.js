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
    mutationFn: ({ name, parentFolderId }) =>
      driveService.createFolder({ name, parentFolderId }),
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
 * Direct-to-R2 upload mutation
 */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, folderId, onProgress }) => {
      // 1. Request presigned upload URL from backend
      const uploadSession = await driveService.requestUploadUrl({
        name: file.name,
        folderId: folderId || null,
        mimeType: file.type || "application/octet-stream",
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
      toast.error(error.response?.data?.message || "File upload failed");
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

