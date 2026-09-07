import { useMutation, useQueryClient } from "@tanstack/react-query";
import groupService from "../services/group.service";
import { chatKeys } from "../queries/chat.keys";

export const useUpdateGroupDescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, description }) =>
      groupService.updateGroupDescription(chatId, description),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.all,
      });
    },
  });
};
