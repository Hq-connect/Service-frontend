import api from "@/api/api";

const notificationService = {
  getNotifications: async ({ page = 1, limit = 20, read, type, before } = {}) => {
    const params = { page, limit };
    if (read !== undefined) params.read = read;
    if (type) params.type = type;
    if (before) params.before = before;

    const response = await api.get("/notifications", { params });
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread/count");
    return response.data.data.unreadCount;
  },

  getNotificationById: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data.data.notification;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data.notification;
  },

  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data.data;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  clearAllNotifications: async () => {
    const response = await api.delete("/notifications");
    return response.data;
  },

  subscribeToPush: async (subscription) => {
    const response = await api.post("/notifications/push/subscribe", {
      subscription,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    return response.data.data;
  },

  unsubscribeFromPush: async (endpoint) => {
    const response = await api.post("/notifications/push/unsubscribe", {
      endpoint,
    });
    return response.data;
  },

  getSubscriptions: async () => {
    const response = await api.get("/notifications/push/subscriptions");
    return response.data.data.subscriptions;
  },
};

export default notificationService;
