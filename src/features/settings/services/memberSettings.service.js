import api from "@/api/api";

const memberSettingsService = {
  /**
   * Update the current user's profile (supports plain object or FormData with avatar file)
   * PATCH /api/settings/me/profile
   */
  updateProfile: async (profileData) => {
    let payload = profileData;

    if (!(profileData instanceof FormData)) {
      const hasFile = profileData?.avatar instanceof File || profileData?.avatar instanceof Blob;
      if (hasFile) {
        const formData = new FormData();
        Object.entries(profileData).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (key === "socialLinks" && typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        });
        payload = formData;
      }
    }

    const response = await api.patch("/settings/me/profile", payload);
    return response.data.user;
  },

  /**
   * Update the current user's password
   * PATCH /api/security/password
   */
  updatePassword: async ({ currentPassword, newPassword }) => {
    const response = await api.patch("/security/password", {
      currentPassword,
      newPassword,
    });
    return response.data.data?.user || response.data;
  },

  /**
   * List all active login sessions for the current user
   * GET /api/settings/me/security/sessions
   */
  getSessions: async () => {
    const response = await api.get("/settings/me/security/sessions");
    return response.data.data;
  },

  /**
   * Revoke all active sessions except the current session
   * DELETE /api/settings/me/security/sessions
   */
  revokeOtherSessions: async () => {
    const response = await api.delete("/settings/me/security/sessions");
    return response.data.data;
  },

  /**
   * Revoke a specific session by its sessionId
   * DELETE /api/settings/me/security/sessions/:sessionId
   */
  revokeSession: async (sessionId) => {
    const response = await api.delete(`/settings/me/security/sessions/${sessionId}`);
    return response.data.data;
  },
};

export default memberSettingsService;

