import api from "@/api/api";

const userManagementService = {
  /**
   * Lists tenant members with pagination, search, and role/status filters
   * GET /api/settings/users
   */
  getUsers: async ({ page = 1, limit = 20, search, role, status } = {}) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.status = status;

    const response = await api.get("/settings/users", { params });
    return response.data.data;
  },

  /**
   * Retrieves details of a specific member in the workspace
   * GET /api/settings/users/:userId
   */
  getUserById: async (userId) => {
    const response = await api.get(`/settings/users/${userId}`);
    return response.data.data.user;
  },

  /**
   * Retrieves workspace-wide user & invitation statistics
   * GET /api/settings/users/stats
   */
  getUserStats: async () => {
    const response = await api.get("/settings/users/stats");
    return response.data.data;
  },

  /**
   * Updates a member's role (admin <-> member)
   * PATCH /api/settings/users/:userId/role
   */
  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/settings/users/${userId}/role`, { role });
    return response.data.data.user;
  },

  /**
   * Updates a member's status (active, suspended, deleted)
   * PATCH /api/settings/users/:userId/status
   */
  updateUserStatus: async (userId, status) => {
    const response = await api.patch(`/settings/users/${userId}/status`, { status });
    return response.data.data.user;
  },

  /**
   * Soft-deletes a member from the workspace and evicts their sessions
   * DELETE /api/settings/users/:userId
   */
  removeUser: async (userId) => {
    const response = await api.delete(`/settings/users/${userId}`);
    return response.data;
  },

  /**
   * Sends workspace invitations to one or up to 20 email addresses
   * POST /api/settings/users/invite
   */
  inviteUsers: async (invitesOrSingle) => {
    const body = Array.isArray(invitesOrSingle)
      ? { invites: invitesOrSingle }
      : invitesOrSingle?.invites
        ? invitesOrSingle
        : { invites: [invitesOrSingle] };

    const response = await api.post("/settings/users/invite", body);
    return response.data.data;
  },

  /**
   * Lists workspace invitations with pagination and optional status filter
   * GET /api/settings/users/invites
   */
  getInvites: async ({ page = 1, limit = 20, status } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;

    const response = await api.get("/settings/users/invites", { params });
    return response.data.data;
  },

  /**
   * Resends a pending invitation (rotates token and extends expiry by 7 days)
   * POST /api/settings/users/invites/:inviteId/resend
   */
  resendInvite: async (inviteId) => {
    const response = await api.post(`/settings/users/invites/${inviteId}/resend`);
    return response.data.data.invite;
  },

  /**
   * Revokes a pending invitation and immediately invalidates its token
   * DELETE /api/settings/users/invites/:inviteId
   */
  revokeInvite: async (inviteId) => {
    const response = await api.delete(`/settings/users/invites/${inviteId}`);
    return response.data;
  },
};

export default userManagementService;

