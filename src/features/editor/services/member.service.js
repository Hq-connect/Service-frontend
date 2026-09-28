import api from "@/api/api";

const memberService = {
  /**
   * Get all collaborators and general access level for a document
   * @param {string} documentId
   */
  getMembers: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/members`);
    return response.data.data;
  },

  /**
   * Add or update a collaborator's role
   * @param {string} documentId
   * @param {{ userId: string, role: "owner" | "editor" | "viewer" }} payload
   */
  addOrUpdateMember: async (documentId, payload) => {
    const response = await api.post(`/documents/${documentId}/members`, payload);
    return response.data.data;
  },

  /**
   * Remove a collaborator from document
   * @param {string} documentId
   * @param {string} memberUserId
   */
  removeMember: async (documentId, memberUserId) => {
    const response = await api.delete(`/documents/${documentId}/members/${memberUserId}`);
    return response.data;
  },

  /**
   * Update general workspace access level
   * @param {string} documentId
   * @param {"restricted" | "workspace_view" | "workspace_edit"} generalAccess
   */
  updateGeneralAccess: async (documentId, generalAccess) => {
    const response = await api.patch(`/documents/${documentId}/access`, { generalAccess });
    return response.data.data;
  },
};

export default memberService;
