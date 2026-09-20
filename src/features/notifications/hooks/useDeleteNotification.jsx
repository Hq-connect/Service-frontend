import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "../queries/notification.keys";
import notificationService from "../services/notification.service";

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export default useDeleteNotification;
