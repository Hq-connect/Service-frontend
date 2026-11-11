export const settingsKeys = {
  all: ["settings"],

  // Member self-service
  sessions: () => [...settingsKeys.all, "sessions"],

  // Admin: Workspace
  workspace: () => [...settingsKeys.all, "workspace"],

  // Admin: Branding
  branding: () => [...settingsKeys.all, "branding"],

  // Admin: Users & Invitations
  users: () => [...settingsKeys.all, "users"],
  userList: (filters = {}) => [...settingsKeys.users(), "list", filters],
  userDetail: (userId) => [...settingsKeys.users(), "detail", userId],
  userStats: () => [...settingsKeys.users(), "stats"],

  invites: () => [...settingsKeys.all, "invites"],
  inviteList: (filters = {}) => [...settingsKeys.invites(), "list", filters],

  // Admin: Audit Logs
  auditLogs: () => [...settingsKeys.all, "audit-logs"],
  auditLogList: (filters = {}) => [...settingsKeys.auditLogs(), "list", filters],
};

