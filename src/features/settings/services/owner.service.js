import api from "@/api/api";

const ownerService = {
  /**
   * Transfers workspace ownership to another active member (re-auth required).
   * POST /api/settings/owner/transfer
   */
  transferOwnership: async ({ newOwnerId, password }) => {
    const response = await api.post("/settings/owner/transfer", {
      newOwnerId,
      password,
    });
    return response.data.data;
  },

  /**
   * Signs out every member except the owner (re-auth required).
   * POST /api/settings/owner/revoke-all-sessions
   */
  revokeAllSessions: async ({ password }) => {
    const response = await api.post("/settings/owner/revoke-all-sessions", {
      password,
    });
    return response.data.data;
  },
};

export default ownerService;

