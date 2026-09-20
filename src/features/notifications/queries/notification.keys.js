export const notificationKeys = {
  all: ["notifications"],

  lists: () => [...notificationKeys.all, "list"],

  list: (filters = {}) => [...notificationKeys.lists(), filters],

  unreadCount: () => [...notificationKeys.all, "unread-count"],

  detail: (id) => [...notificationKeys.all, "detail", id],

  pushSubscriptions: () => [...notificationKeys.all, "push-subscriptions"],
};
