import api from "@/api/api";

const documentService = {
  /**
   * Get all accessible documents for the current user
   * @param {{ folderId?: string, isArchived?: boolean }} params
   */
  getDocuments: async (params = {}) => {
    const response = await api.get("/documents", { params });
    return response.data.data;
  },

  /**
   * Get a single document by ID
   * @param {string} id
   */
  getDocumentById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    const data = response.data.data;
    if (data?.document) {
      return {
        ...data.document,
        userRole: data.userRole,
      };
    }
    return data;
  },

  /**
   * Create a new document
   * @param {{ title?: string, icon?: string, coverImage?: string, folderId?: string|null, content?: any }} payload
   */
  createDocument: async (payload = {}) => {
    const response = await api.post("/documents", payload);
    return response.data.data;
  },

  /**
   * Update document metadata (title, icon, coverImage, folderId, generalAccess)
   * @param {string} id
   * @param {object} updates
   */
  updateDocument: async (id, updates) => {
    try {
      const response = await api.patch(`/documents/${id}`, updates);
      return response.data.data;
    } catch (err) {
      if (err.response?.status === 405 || err.response?.status === 404) {
        const fallback = await api.put(`/documents/${id}`, updates);
        return fallback.data.data;
      }
      throw err;
    }
  },

  /**
   * Archive document
   * @param {string} id
   */
  archiveDocument: async (id) => {
    const response = await api.post(`/documents/${id}/archive`);
    return response.data.data;
  },

  /**
   * Restore document from archive
   * @param {string} id
   */
  restoreDocument: async (id) => {
    const response = await api.post(`/documents/${id}/restore`);
    return response.data.data;
  },

  /**
   * Delete document permanently
   * @param {string} id
   */
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  /**
   * Duplicate document
   * @param {string} id
   */
  duplicateDocument: async (id) => {
    const response = await api.post(`/documents/${id}/duplicate`);
    return response.data.data;
  },

  /**
   * Export document (format: "html" | "markdown" | "json")
   * @param {string} id
   * @param {string} format
   */
  exportDocument: async (id, format = "markdown") => {
    const response = await api.get(`/documents/${id}/export`, {
      params: { format },
    });
    return response.data.data;
  },
};

export default documentService;
