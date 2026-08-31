import React from "react";
import DMListItem from "../variants/dm/DMListItem";
import GroupListItem from "../variants/group/GroupListItem";
import ChannelListItem from "../variants/channel/ChannelListItem";

/**
 * Base chat list item dispatcher. Routes to the correct variant.
 * @param {"dm"|"group"|"channel"} type
 * @param {object} chat
 */
function ChatListItem({ type, chat }) {
  if (type === "dm") return <DMListItem chat={chat} />;
  if (type === "group") return <GroupListItem chat={chat} />;
  if (type === "channel") return <ChannelListItem chat={chat} />;
  return null;
}

export default ChatListItem;
