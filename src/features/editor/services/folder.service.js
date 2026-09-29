import api from "@/api/api";

const folderService = {
  /**
   * Fetch the full folder hierarchy and accessible root documents
   * @returns {Promise<{ folders: Array, rootDocuments: Array }>}
   */
  getTree: async () => {
    const response = await api.get("/documents/folders/tree");
    return response.data.data;
  },

  /**
   * Fetch flat list of folders optionally filtered by parentId
   * @param {string|null} parentId
   */
  getFolders: async (parentId = null) => {
    const response = await api.get("/documents/folders", {
      params: parentId ? { parentId } : {},
    });
    return response.data.data;
  },

  /**
   * Get single folder by ID
   * @param {string} id
   */
  getFolderById: async (id) => {
    const response = await api.get(`/documents/folders/${id}`);
    return response.data.data;
  },

  /**
   * Create a new folder
   * @param {{ name: string, icon?: string, parentId?: string|null }} payload
   */
  createFolder: async (payload) => {
    const response = await api.post("/documents/folders", payload);
    return response.data.data;
  },

  /**
   * Update folder name, icon, or parent
   * @param {string} id
   * @param {{ name?: string, icon?: string, parentId?: string|null }} updates
   */
  updateFolder: async (id, updates) => {
    const response = await api.put(`/documents/folders/${id}`, updates);
    return response.data.data;
  },

  /**
   * Delete folder (children are orphaned to root)
   * @param {string} id
   */
  deleteFolder: async (id) => {
    const response = await api.delete(`/documents/folders/${id}`);
    return response.data;
  },
};

export default folderService;
