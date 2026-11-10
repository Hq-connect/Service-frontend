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

  unread: () => [
    ...chatKeys.all,
    "unread",
  ],

  channelDetails: (chatId) => [
    ...chatKeys.all,
    "channel",
    "details",
    chatId,
  ],

  discoverChannels: (search = "") => [
    ...chatKeys.all,
    "channel",
    "discover",
    search,
  ],

  mentions: (chatId = "all") => [
    ...chatKeys.all,
    "mentions",
    chatId,
  ],
};