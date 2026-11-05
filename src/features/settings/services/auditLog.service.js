import api from "@/api/api";

const auditLogService = {
  /**
   * Fetches paginated audit logs for the current workspace
   * GET /api/settings/audit-logs
   */
  getAuditLogs: async ({ page = 1, limit = 20, action, targetType, actorId, from, to } = {}) => {
    const params = { page, limit };
    if (action) params.action = action;
    if (targetType) params.targetType = targetType;
    if (actorId) params.actorId = actorId;
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await api.get("/settings/audit-logs", { params });
    return response.data.data;
  },
};

export default auditLogService;

