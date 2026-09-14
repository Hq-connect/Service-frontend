import { useQuery } from "@tanstack/react-query";
import groupService from "../services/group.service";
import { chatKeys } from "../queries/chat.keys";

export const useGroupMembers = (chatId) => {
  return useQuery({
    queryKey: chatKeys.members(chatId),
    queryFn: () => groupService.getGroupMembers(chatId),
    enabled: !!chatId && !chatId.startsWith("new-"),
  });
};
