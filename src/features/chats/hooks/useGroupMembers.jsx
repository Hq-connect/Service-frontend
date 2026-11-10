import { useQuery } from "@tanstack/react-query";
import groupService from "../services/group.service";
import channelService from "../services/channel.service";
import { chatKeys } from "../queries/chat.keys";

export const useGroupMembers = (chatId, chatType = "group") => {
  return useQuery({
    queryKey: chatKeys.members(chatId),
    queryFn: () =>
      chatType === "channel"
        ? channelService.getChannelMembers(chatId)
        : groupService.getGroupMembers(chatId),
    enabled: !!chatId && !chatId.startsWith("new-"),
  });
};
