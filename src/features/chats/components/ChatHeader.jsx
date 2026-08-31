import React from "react";
import DMHeader from "../variants/dm/DMHeader";
import GroupHeader from "../variants/group/GroupHeader";
import ChannelHeader from "../variants/channel/ChannelHeader";

/**
 * Resolves the correct header variant based on chat type.
 * @param {"dm"|"group"|"channel"} chatType
 * @param {object} chat
 */
function ChatHeader({ chatType, chat }) {
  if (chatType === "dm") return <DMHeader chat={chat} />;
  if (chatType === "group") return <GroupHeader chat={chat} />;
  if (chatType === "channel") return <ChannelHeader chat={chat} />;
  return null;
}

export default ChatHeader;
