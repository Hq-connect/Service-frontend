// Chat Socket Event Names
// TODO: Wire these with socket.io when ready

export const CHAT_EVENTS = {
  // Emit
  JOIN_CHAT: "chat:join",
  LEAVE_CHAT: "chat:leave",
  SEND_MESSAGE: "chat:message:send",
  TYPING_START: "chat:typing:start",
  TYPING_STOP: "chat:typing:stop",
  MESSAGE_REACT: "chat:message:react",
  MESSAGE_EDIT: "chat:message:edit",
  MESSAGE_DELETE: "chat:message:delete",
  MESSAGE_READ: "chat:message:read",

  // Listen
  NEW_MESSAGE: "chat:message:new",
  MESSAGE_UPDATED: "chat:message:updated",
  MESSAGE_DELETED: "chat:message:deleted",
  USER_TYPING: "chat:user:typing",
  USER_STOPPED_TYPING: "chat:user:stopped_typing",
  PRESENCE_UPDATE: "chat:presence:update",
};
