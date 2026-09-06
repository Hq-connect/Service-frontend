import { useMutation, useQueryClient } from "@tanstack/react-query";
import groupService from "../services/group.service";
import { chatKeys } from "../queries/chat.keys";

export const useAddGroupMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, userIds }) =>
      groupService.addInGroup(chatId, userIds),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.members(variables.chatId),
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.all,
      });
    },
  });
};
