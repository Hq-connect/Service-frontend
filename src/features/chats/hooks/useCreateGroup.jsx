import { useMutation, useQueryClient } from "@tanstack/react-query";
import groupService from "../services/group.service";
import { chatKeys } from "../queries/chat.keys";

export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description, members }) =>
      groupService.createGroup(name, description, members),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.list("group"),
      });
    },
  });
};
