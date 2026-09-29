import api from "@/api/api";

const commentService = {
  /**
   * Get all comments for a document
   * @param {string} documentId
   * @param {string} [status] - "open" | "resolved"
   */
  getComments: async (documentId, status) => {
    const response = await api.get(`/documents/${documentId}/comments`, {
      params: status ? { status } : {},
    });
    return response.data.data;
  },

  /**
   * Create an anchored inline comment thread
   * @param {string} documentId
   * @param {{ content: string, blockId?: string, selectedText?: string, anchorFrom?: number, anchorTo?: number }} payload
   */
  createComment: async (documentId, payload) => {
    const response = await api.post(`/documents/${documentId}/comments`, payload);
    return response.data.data;
  },

  /**
   * Add a reply to an existing comment
   * @param {string} commentId
   * @param {string} content
   */
  addReply: async (commentId, content) => {
    const response = await api.post(`/documents/comments/${commentId}/reply`, { content });
    return response.data.data;
  },

  /**
   * Mark comment as resolved
   * @param {string} commentId
   */
  resolveComment: async (commentId) => {
    const response = await api.patch(`/documents/comments/${commentId}/resolve`);
    return response.data.data;
  },

  /**
   * Reopen a resolved comment
   * @param {string} commentId
   */
  reopenComment: async (commentId) => {
    const response = await api.patch(`/documents/comments/${commentId}/reopen`);
    return response.data.data;
  },

  /**
   * Update comment text
   * @param {string} commentId
   * @param {string} content
   */
  updateComment: async (commentId, content) => {
    const response = await api.put(`/documents/comments/${commentId}`, { content });
    return response.data.data;
  },

  /**
   * Delete comment thread
   * @param {string} commentId
   */
  deleteComment: async (commentId) => {
    const response = await api.delete(`/documents/comments/${commentId}`);
    return response.data;
  },
};

export default commentService;
