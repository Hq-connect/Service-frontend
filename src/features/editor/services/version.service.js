import api from "@/api/api";

const versionService = {
  /**
   * List version history timeline for a document
   * @param {string} documentId
   * @param {{ page?: number, limit?: number }} params
   */
  getVersions: async (documentId, params = {}) => {
    const response = await api.get(`/documents/${documentId}/versions`, { params });
    return response.data.data;
  },

  /**
   * Get a specific version snapshot (includes contentSnapshot for diff)
   * @param {string} documentId
   * @param {string} versionId
   */
  getVersionById: async (documentId, versionId) => {
    const response = await api.get(`/documents/${documentId}/versions/${versionId}`);
    return response.data.data;
  },

  /**
   * Create a manual milestone version snapshot
   * @param {string} documentId
   * @param {{ changeSummary?: string }} payload
   */
  createVersion: async (documentId, payload = {}) => {
    const response = await api.post(`/documents/${documentId}/versions`, payload);
    return response.data.data;
  },

  /**
   * Restore document to an older version
   * @param {string} documentId
   * @param {string} versionId
   */
  restoreVersion: async (documentId, versionId) => {
    const response = await api.post(`/documents/${documentId}/versions/${versionId}/restore`);
    return response.data.data;
  },
};

export default versionService;
