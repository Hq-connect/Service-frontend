import api from "@/api/api";

const workspaceService = {
  /**
   * Retrieves workspace metadata (name, slug, timezone, language, allowedEmailDomains)
   * GET /api/settings/workspace
   */
  getWorkspace: async () => {
    const response = await api.get("/settings/workspace");
    return response.data.data.workspace;
  },

  /**
   * Updates workspace name, timezone, language, or allowedEmailDomains
   * PATCH /api/settings/workspace
   */
  updateWorkspace: async (updateData) => {
    const response = await api.patch("/settings/workspace", updateData);
    return response.data.data.workspace;
  },
};

export default workspaceService;

