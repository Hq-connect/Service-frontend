import api from "@/api/api";
import axios from "axios";

const driveService = {
  /**
   * Fetch folder contents (files and subfolders)
   */
  async listContents({
    folderId = null,
    search = "",
    isStarred,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 50,
  } = {}) {
    const params = {
      ...(folderId ? { folderId } : {}),
      ...(search ? { search } : {}),
      ...(isStarred !== undefined ? { isStarred } : {}),
      sortBy,
      order,
      page,
      limit,
    };
    const response = await api.get("/drive", { params });
    return response.data?.data || { folders: [], files: [], pagination: {} };
  },

  /**
   * Folder operations
   */
  async createFolder({ name, parentFolderId = null }) {
    const response = await api.post("/drive/folders", { name, parentFolderId });
    return response.data?.data?.folder;
  },

  async getFolderDetails(folderId) {
    const response = await api.get(`/drive/folders/${folderId}`);
    return response.data?.data?.folder;
  },

  async renameFolder(folderId, name) {
    const response = await api.patch(`/drive/folders/${folderId}/rename`, { name });
    return response.data?.data?.folder;
  },

  async moveFolder(folderId, targetParentFolderId = null) {
    const response = await api.patch(`/drive/folders/${folderId}/move`, {
      targetParentFolderId,
    });
    return response.data?.data?.folder;
  },

  async trashFolder(folderId) {
    const response = await api.delete(`/drive/folders/${folderId}`);
    return response.data;
  },

  async restoreFolder(folderId) {
    const response = await api.post(`/drive/folders/${folderId}/restore`);
    return response.data;
  },

  /**
   * Direct-to-R2 Upload Flow
   */
  async requestUploadUrl({ name, folderId = null, mimeType }) {
    const response = await api.post("/drive/uploads", {
      name,
      folderId: folderId || null,
      mimeType,
    });
    return response.data?.data; // { uploadUrl, fileId, versionId, objectKey }
  },

  async uploadBytesToR2(uploadUrl, file, onUploadProgress) {
    // Pure axios PUT call directly to Cloudflare R2 (bypasses backend API)
    return await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      onUploadProgress,
    });
  },

  async completeUpload(fileId, versionId) {
    const response = await api.post(`/drive/uploads/${fileId}/complete/${versionId}`);
    return response.data?.data?.file;
  },

  /**
   * File operations
   */
  async getDownloadUrl(fileId, isInline = false) {
    const response = await api.get(`/drive/${fileId}/download-url`, {
      params: { isInline },
    });
    return response.data?.data; // { downloadUrl, name, mimeType, size }
  },

  async getFileDetails(fileId) {
    const response = await api.get(`/drive/${fileId}`);
    return response.data?.data?.file;
  },

  async renameFile(fileId, name) {
    const response = await api.patch(`/drive/${fileId}/rename`, { name });
    return response.data?.data?.file;
  },

  async moveFile(fileId, targetFolderId = null) {
    const response = await api.patch(`/drive/${fileId}/move`, { targetFolderId });
    return response.data?.data?.file;
  },

  async toggleStar(fileId) {
    const response = await api.patch(`/drive/${fileId}/star`);
    return response.data?.data?.file;
  },

  async trashFile(fileId) {
    const response = await api.delete(`/drive/${fileId}`);
    return response.data;
  },

  async restoreFile(fileId) {
    const response = await api.post(`/drive/${fileId}/restore`);
    return response.data;
  },

  async listVersions(fileId) {
    const response = await api.get(`/drive/${fileId}/versions`);
    return response.data?.data?.versions || [];
  },

  /**
   * Shares and Audit Activity
   */
  async listShares(targetId) {
    const response = await api.get(`/drive/shares/${targetId}`);
    return response.data?.data?.shares || [];
  },

  async grantUserAccess({ targetType, targetId, subjectUserId, role }) {
    const response = await api.post("/drive/shares/user", {
      targetType,
      targetId,
      subjectUserId,
      role,
    });
    return response.data?.data?.share;
  },

  async createShareLink({ targetType, targetId, role = "Viewer", expiresInDays = 7 }) {
    const response = await api.post("/drive/shares/link", {
      targetType,
      targetId,
      role,
      expiresInDays,
    });
    return response.data?.data; // { shareId, role, expiresAt, token }
  },

  async revokeShare(shareId) {
    const response = await api.delete(`/drive/shares/${shareId}`);
    return response.data;
  },

  async getActivity(targetId) {
    const response = await api.get(`/drive/shares/${targetId}/activity`);
    return response.data?.data?.activities || [];
  },
};

export default driveService;

