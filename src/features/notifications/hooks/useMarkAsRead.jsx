import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { notificationKeys } from "../queries/notification.keys";
import notificationService from "../services/notification.service";
import { decrementUnreadCount } from "../states/notification.slice";

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onMutate: () => {
      dispatch(decrementUnreadCount(1));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export default useMarkAsRead;
