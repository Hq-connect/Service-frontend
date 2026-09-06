export const chatKeys = {
  all: ["chats"],

  lists: () => [
    ...chatKeys.all,
    "list",
  ],

  list: (type) => [
    ...chatKeys.lists(),
    type,
  ],

  messages: (type, chatId) => [
    ...chatKeys.all,
    type,
    "messages",
    chatId,
  ],

  members: (chatId) => [
    ...chatKeys.all,
    "members",
    chatId,
  ],
};