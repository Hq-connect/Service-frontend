import { useMutation, useQueryClient } from "@tanstack/react-query";
import groupService from "../services/group.service";
import { chatKeys } from "../queries/chat.keys";

export const useUpdateGroupName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, name }) =>
      groupService.updateGroupName(chatId, name),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.all,
      });
    },
  });
};
